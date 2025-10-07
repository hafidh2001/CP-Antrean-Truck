import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";
import type { IAntreanCard } from "@/types/antreanTruck";
import { AntreanStatusEnum } from "@/types";

interface AntreanCardProps {
  antrean: IAntreanCard;
  onClick: (antrean: IAntreanCard) => void;
}

export function AntreanCard({ antrean, onClick }: AntreanCardProps) {
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const formattedDate = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date: formattedDate, time: formattedTime };
  };

  const { date, time } = formatDateTime(antrean.created_at);

  return (
    <Card
      className="cursor-pointer hover:bg-blue-50 transition-all duration-200 border-gray-300 shadow-sm hover:shadow-md"
      onClick={() => onClick(antrean)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-900">
                  {antrean.nopol}
                </div>
                <div className="text-sm text-gray-600">
                  {date} • {time}
                </div>
              </div>
            </div>
            {(antrean.status === AntreanStatusEnum.VERIFYING || antrean.status === AntreanStatusEnum.PENDING) && (
              <div className="text-sm text-gray-600">{antrean.status}</div>
            )}
          </div>

          <div className="text-sm font-semibold text-gray-700">
            {antrean.jenis_barang} Jenis Barang
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
