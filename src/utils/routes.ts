export class ROUTES {
  static get base() {
    return `/` as const;
  }
    
  static get warehouse() {
    return `/warehouse` as const;
  }
  
  static get decrypt() {
    return `/decrypt` as const;
  }
  
  static warehouseDetail() {
    return `${this.warehouse}` as const;
  }
  
  static warehouseView(warehouseId: string): string {
    return `${this.warehouse}/${warehouseId}/view` as const;
  }
}