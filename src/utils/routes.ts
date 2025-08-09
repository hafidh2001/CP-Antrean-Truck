export class ROUTES {
  static get base() {
    return `/` as const;
  }
  
  static get home() {
    return `/` as const;
  }
  
  static get warehouse() {
    return `/warehouse` as const;
  }
  
  static warehouseDetail(warehouseId: string): string {
    return `${this.warehouse}/${warehouseId}` as const;
  }
}