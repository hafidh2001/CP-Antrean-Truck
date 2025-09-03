export interface IQuantityItem {
  amount: number;
  unit: string; // box, staple, sack, pk-box, pb-sack, pb-box, pk-sack, pallet
}

export interface IProductionCode {
  id: number;
  goods_code: string; // Kode produksi (m_goods)
  goods_name: string;
  quantities: IQuantityItem[]; // Array of quantities with their UOMs
  total_entries: number;
  completed_entries: number;
}

export interface IProductionCodeCard extends IProductionCode {
  isCompleted: boolean;
  progress_percentage: number;
}