import { AntreanStatusEnum } from "..";

export interface IAntreanCard {
  id: number;
  nopol: string;
  created_at: string;
  jenis_barang: number;
  status: keyof typeof AntreanStatusEnum;
}

export interface AntreanTruckDecryptData {
  user_token: string;
}
