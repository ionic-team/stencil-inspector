# Stencil Inspector

![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)

A minimal Chrome extension for debugging web components built with [Stencil](https://stenciljs.com/).

Compatibility: Stencil 0.7.0 and up

Provided inspections:
<details>
   <summary>Props</summary>
   <ul>
      <li>Type</li>
      <li>Mutable</li>
      <li>Connect</li>
      <li>Context</li>
      <li>Watchers</li>
      <li>Value (including edit for string, number and boolean props)</li>
   </ul>
</details>
<details>
   <summary>States</summary>
   <ul>
      <li>Watchers</li>
      <li>Value (including edit for string, number and boolean values)</li>
   </ul>
</details>
<details>
   <summary>Elements</summary>
</details>
<details>
   <summary>Methods</summary>
</details>
<details>
   <summary>Events</summary>
   <ul>
      <details>
         <summary>Emitters</summary>
         <ul>
            <li>Definition</li>
            <li>
               Flags
               <ul>
                  <li>Bubbles</li>
                  <li>Cancelable</li>
                  <li>Composed</li>
               </ul>
            </li>
         </ul>
      </details>
      <details>
         <summary>Listeners</summary>
         <ul>
            <li>Definition</li>
            <li>
               Flags
               <ul>
                  <li>Capture</li>
                  <li>Disabled</li>
                  <li>Passive</li>
               </ul>
            </li>
         </ul>
      </details>
   </ul>
</details>
<details>
   <summary>Lifecycle methods</summary>
</details>
<details>
   <summary>Internal class members </summary>
</details>

## Instructions

1. Clone the repo
2. Build the project using `npm run build`
3. Load unpacked extension in Chrome
4. Point to the `www` folder

## Screenshots

![Screenshot 1](docs/assets/screenshot1.jpg?raw=true "Screenshot 1")
![Screenshot 2](docs/assets/screenshot2.jpg?raw=true "Screenshot 2")
![Screenshot 3](docs/assets/screenshot3.jpg?raw=true "Screenshot 3")

## Credits

* [Stencil Team](https://stenciljs.com/)
* [Aurelia Inspector](https://github.com/aurelia/inspector)
* [Vue.js devtools](https://github.com/vuejs/vue-devtools)
* [Douglas Crockford](https://github.com/douglascrockford/JSON-js)