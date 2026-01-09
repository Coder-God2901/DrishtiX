/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
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
