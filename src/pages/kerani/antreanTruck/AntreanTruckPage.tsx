import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAntreanTruckStore } from "@/store/antreanTruckStore";
import { AntreanCard } from "./_components/AntreanCard";
import type { IAntreanCard } from "@/types/antreanTruck";
import { ROUTES } from "@/utils/routes";
import { sessionService } from "@/services/sessionService";
import { extractEncryptedKey } from "@/utils/urlParams";

export function AntreanTruckPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { antreanList, isLoading, error, loadAntreanListFromApi, reset } =
    useAntreanTruckStore();
  useEffect(() => {
    const initPage = async () => {
      const encryptedData = extractEncryptedKey(location.search);

      if (!encryptedData) {
        console.error("No encrypted key found in URL");
        navigate(ROUTES.base);
        return;
      }

      try {
        // Save session for use in other kerani pages
        await sessionService.saveSession(encryptedData);
        await loadAntreanListFromApi(encryptedData);
      } catch (error) {
        console.error("Failed to initialize antrean truck:", error);
        navigate(ROUTES.base);
      }
    };

    initPage();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
      // Note: Don't clear session here, it should persist for navigation between kerani pages
    };
  }, [reset]);

  const handleCardClick = (antrean: IAntreanCard) => {
    navigate(`/production-code/${antrean.id}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full h-screen bg-white flex flex-col">
          <div className="bg-white border-b border-gray-200 p-6 text-center flex-shrink-0">
            <h1 className="text-3xl font-bold text-gray-800">Antrian Kerani</h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-gray-500">Memuat data antrean...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full h-screen bg-white flex flex-col">
          <div className="bg-white border-b border-gray-200 p-6 text-center flex-shrink-0">
            <h1 className="text-3xl font-bold text-gray-800">Antrian Kerani</h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500">Error: {error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full h-screen bg-white flex flex-col">
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 p-6 text-center flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-800">Antrian Kerani</h1>
        </div>

        {/* Scrollable Content - Takes remaining height */}
        <div className="flex-1 overflow-y-auto p-4">
          {antreanList.length === 0 ? (
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
