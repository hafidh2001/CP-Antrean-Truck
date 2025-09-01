import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAntreanTruckStore } from '@/store/antreanTruckStore';
import { AntreanCard } from './_components/AntreanCard';
import type { IAntreanCard } from '@/types/antreanTruck';

export function AntreanTruckPage() {
  const navigate = useNavigate();
  const { antreanList, isLoading, loadAntreanList } = useAntreanTruckStore();

  useEffect(() => {
    loadAntreanList();
  }, [loadAntreanList]);

  const handleCardClick = (antrean: IAntreanCard) => {
    navigate(`/production-code/${antrean.nopol}`);
  };

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full h-screen bg-white flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 p-6 text-center flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-800">Antrian Krani</h1>
        </div>

        {/* Scrollable Content - Takes remaining height */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Memuat data antrean...</div>
            </div>
          ) : antreanList.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Tidak ada antrean saat ini</div>
            </div>
          ) : (
            <div className="space-y-3">
              {antreanList.map((antrean) => (
                <AntreanCard
                  key={antrean.id}
                  antrean={antrean}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AntreanTruckPage;