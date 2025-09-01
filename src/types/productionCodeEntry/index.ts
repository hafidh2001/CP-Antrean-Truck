export interface IJebolan {
  id: string;
  quantity: number;
  timestamp: string;
}

export interface IProductionCodeEntry {
  id: string;
  code: string;
  timestamp: string;
}

export interface IProductionCodeEntryData {
  productionCodeId: number;
  goods_code: string;
  goods_name: string;
  do_no: string;
  quantities: Array<{ quantity: number; uom: string }>;
  total_entries: number;
  completed_entries: number;
  jebolan: IJebolan | null;
  productionCodes: IProductionCodeEntry[];
}