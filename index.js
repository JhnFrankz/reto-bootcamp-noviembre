import fs from "fs";
import puppeteer from "puppeteer";

(async () => {
  const URL = "https://www.plazavea.com.pe/";

  if (!fs.existsSync("output")) {
    fs.mkdirSync("output", { recursive: true });
  }
  if (!fs.existsSync("output/subcategories")) {
    fs.mkdirSync("output/subcategories", { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "networkidle2" });

  await page.click(".header__internal-links .dropdown__button.gtm_element");
  await page.waitForSelector(".MainMenu__wrapper__departments__item__link", { visible: true });

  // Devuelve ElementHandle de puppeteer (para hacer click, hover, etc)
  const categories = Array.from(await page.$$(".MainMenu__wrapper__departments .MainMenu__wrapper__departments__item[data-index]:not(.onlyDesktop) .MainMenu__wrapper__departments__item__link"));


  for (let i = 0; i < categories.length; i++) {
    // Recorremos las categorías
    const allProducts = [];

    console.log("_________CATEGORY_________");
    await page.waitForSelector(".MainMenu__wrapper__departments .MainMenu__wrapper__departments__item__link");
    const category = (await page.$$(".MainMenu__wrapper__departments .MainMenu__wrapper__departments__item[data-index]:not(.onlyDesktop) .MainMenu__wrapper__departments__item__link"))[i];
    const nameCategory = await page.evaluate(el => el.textContent, category);
    console.log(nameCategory);

    if (nameCategory === "Supermercado" || nameCategory === "Moda Mujer" || nameCategory === "Moda Hombre"
      || nameCategory === "Moda Infantil" || nameCategory === "Accesorios" || nameCategory === "Automotriz") {
      // TODO: Implementar lógica para la categoría "Supermercado"
      // Incluye: Supermercado, Moda Mujer, Moda Hombre, Moda Infantil, Accesorios, Automotriz, 
      continue;
    }

    await category.hover();
    await page.waitForSelector(".MainMenu__wrapper__subcategories__item .MainMenu__wrapper__subcategories__item__link");

    const subCategories = Array.from(await page.$$(".MainMenu__wrapper__subcategories__item:not(.marcas) .MainMenu__wrapper__subcategories__item__link"));

    for (let j = 0; j < subCategories.length; j++) {
      // Recorremos las subcategorías
      const subCategory = (await page.$$(".MainMenu__wrapper__subcategories__item:not(.marcas) .MainMenu__wrapper__subcategories__item__link"))[j];
      const nameSubCategory = await page.evaluate(el => el.textContent, subCategory);
      console.log(nameSubCategory);

      await subCategory.click();
      await page.waitForSelector(".showcase-grid", { visible: true });

      let subCatProducts = {
        category: nameCategory,
        subcategory: nameSubCategory,
        products: [],
      };
      let nextPage = true;
      let currentPage = 1;
      let totalPages = null;

      while (nextPage) {
        // Recorremos las páginas de la subcategoría
        const newProducts = await page.evaluate(() => {

          const products = Array.from(document.querySelectorAll(".showcase-grid>.ga-product-item"));

          return products.map(product => {
            const sku = product.getAttribute("data-sku");
            const brand = product.getAttribute("data-ga-brand");
            const name = product.getAttribute("data-ga-name");
            const sellerName = product.querySelector(".Showcase__SellerName")?.innerText;
            const price = product.querySelector(".Showcase__salePrice")?.innerText;
            //TODO: Descomponer el precio

            return {
              sku,
              brand,
              name,
              sellerName,
              price,
            }
          });
        });

        subCatProducts.products = [...subCatProducts.products, ...newProducts];

        if (totalPages === null) {
          totalPages = await page.evaluate(() => {
            const paginationList = [...document.querySelectorAll(".pagination__item.page-number")];
            return parseInt(paginationList[paginationList.length - 1]?.textContent) || 1;
          });
          console.log(`Total de páginas calculado: ${totalPages}`);
        }
        console.log(`Página actual: ${currentPage} de ${totalPages}`);

        if (currentPage >= totalPages || newProducts.length === 0) {
          nextPage = false;
        } else {
          currentPage++;

          nextPage = await page.evaluate((currentPage) => {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set("page", currentPage);
            window.location.href = currentUrl.toString();
            return true;
          }, currentPage);

          await page.waitForNavigation({ waitUntil: "networkidle2" });
        }

        if (currentPage > 2) {
          // TODO: Comentar el if si se quiere scrapear todas las páginas
          nextPage = false;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      allProducts.push({
        category: nameCategory,
        subcategory: nameSubCategory,
        products: subCatProducts.products,
      });

      await page.click(".header__internal-links .dropdown__button.gtm_element");
      await page.waitForSelector(".MainMenu__wrapper__departments__item__link", { visible: true });
      await (await page.$$(".MainMenu__wrapper__departments .MainMenu__wrapper__departments__item[data-index]:not(.onlyDesktop) .MainMenu__wrapper__departments__item__link"))[i].hover();

      fs.writeFileSync(`output/subcategories/${nameCategory}-${nameSubCategory}.json`, JSON.stringify(subCatProducts, null, 2), "utf-8");

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Escribe todos los datos de `allCategories` en un archivo JSON al final
    fs.writeFileSync(`output/${i}-${nameCategory}.json`, JSON.stringify(allProducts, null, 2), "utf-8");

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await browser.close();
})();
