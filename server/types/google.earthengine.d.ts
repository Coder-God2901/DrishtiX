// Minimal type declarations for Google Earth Engine (workaround)
declare namespace ee {
  function Initialize(): void;
  class Image {
    constructor(id: string);
    select(band: string): Image;
    // Add more methods as needed
  }
  class Geometry {
    constructor(type: string, coordinates: any);
    // Add more methods as needed
  }
  // Add more classes/interfaces as needed
}

declare module 'google-earth-engine' {
  export = ee;
}
