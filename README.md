[![Angular](https://img.shields.io/badge/Code-Angular_17-info?logo=Angular&logoColor=white&color=ff0000)](https://angular.dev/)
[![materialdesign](https://img.shields.io/badge/UI/UX-materialdesign-info?logo=materialdesign&logoColor=white&color=757575)](https://material.angular.io/)
[![Leaflet](https://img.shields.io/badge/Map-Leaflet-info?logo=Leaflet&logoColor=white&color=199900)](https://leafletjs.com/)

# Ny Restaurants (front-end) - HUNGRR!!!

HUNGRR!!! is a single page application made with Angular 17. It's designed to give access to a map of Newyork City, where the user could find restaurants around him.

Some forms allow filtering and search for restaurant name, cuisine type, borough and other values.

Back-end part of this app is [NyRestaurantsAPI](https://github.com/Peanuts-83/ny_restaurants_api). The database used in this project is outdated, most restaurants references are no more valid values. For dev practice only, main purpose being to manage a full stack project with API definition, database managment and UI/UX development.

## BRANCH: Custom form field

1. Build efficient custom select component, allowing:

    * **InfiniteScroll**: Loads \<nbr\> (default 30) items on each load. User scroll down fires automatic next load. Stops when end is reached.

    * **Search**: When custom select component is clicked, included search input allow typing search text. Items reloading is engaged, based on search text filter.

2. Main form in AppComponent should easily link to this custom component by implementing **ControlValueAccessor** interface.
