export interface IAntrean {
  id: number;
  nopol: string;
  created_time: string;
  warehouse_id: number;
  status: 'OPEN' | 'LOADING' | 'VERIFYING' | 'VERIFIED' | 'CLOSED';
  note?: string;
}

export interface IAntreanCard {
  id: number;
  nopol: string;
  created_time: string;
  warehouse_name: string;
  goodsCount: number;
}