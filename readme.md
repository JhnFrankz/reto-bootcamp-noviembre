#  Scrapping - Plaza Vea

Pasos para ejecutar el scrapping de la página web de Plaza Vea:

1. Instalar las dependencias
```bash
npm install
```

2. Ejecutar el script
```bash
npm start
```

## Carpetas

En la carpeta `output` se encuentran los archivos `.json` por cada categoría. 

Dentro de la carpeta `output / subcategories` se encuentran los archivos `.json` por cada subcategoría.

## Información

1. El script está limitado a las categorías que `no pertenecen` a `Supermercado`.

2. El scraping está limitado a 2 páginas por subcategoría para mostrar el funcionamiento del script. Se puede modificar esto para que scrapee todas las páginas `eliminando` el `if` de la `línea 111`.

