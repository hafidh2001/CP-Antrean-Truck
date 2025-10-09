import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGateMonitorStore } from "@/store/gateMonitorStore";
import { extractEncryptedKey } from "@/utils/urlParams";
import { decryptAES } from "@/functions/decrypt";
import { ROUTES } from "@/utils/routes";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AntreanStatusEnum } from "@/types";

interface DecryptedData {
  user_token: string;
}

export default function GateMonitorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    gates,
    isLoading,
    error,
    setUserToken,
    startPolling,
    stopPolling,
    reset,
  } = useGateMonitorStore();

  useEffect(() => {
    const initPage = async () => {
      const encryptedData = extractEncryptedKey(location.search);

      if (!encryptedData) {
        console.error("No encrypted key found in URL");
        navigate(ROUTES.base);
        return;
      }

      try {
        const decrypted = await decryptAES<DecryptedData>(encryptedData);

        if (!decrypted.user_token) {
          throw new Error("Invalid token data");
        }

        setUserToken(decrypted.user_token);
        startPolling(1000); // Update count up every second
      } catch (error) {
        console.error("Failed to initialize gate monitor:", error);
        navigate(ROUTES.base);
      }
    };

    initPage();

    // Cleanup
    return () => {
      stopPolling();
      reset();
    };
  }, []);

  if (isLoading && gates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-500">Memuat data gate...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center text-red-500 mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-semibold">Error</span>
          </div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  const getCardColor = (status: string) => {
    switch (status) {
      case AntreanStatusEnum.VERIFYING:
        return "bg-yellow-500 border-yellow-600"; // Verifying - yellow
      case AntreanStatusEnum.LOADING:
        return "bg-blue-500 border-blue-600"; // Loading - blue
      default:
        return "bg-gray-400 border-gray-500"; // Default - gray
    }
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Gate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Antrean Truck
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Waiting (OPEN)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {gates.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada antrean truck saat ini
                </td>
              </tr>
            ) : (
              gates.map((gate) => {
                // Filter antrean by status
                const loadingVerifyingAntrean = gate.antrean_list.filter(
                  (antrean) =>
                    antrean.status === AntreanStatusEnum.LOADING ||
                    antrean.status === AntreanStatusEnum.VERIFYING
                );
                const openAntrean = gate.antrean_list.filter(
                  (antrean) => antrean.status === AntreanStatusEnum.OPEN
                );
                const openCount = openAntrean.length;

                // Show first 3 OPEN trucks in center column
                const displayedOpenAntrean = openAntrean.slice(0, 3);

                // Combine: LOADING/VERIFYING + first 3 OPEN
                const activeAntrean = [...loadingVerifyingAntrean, ...displayedOpenAntrean];

                return (
                  <tr key={gate.gate_id} className="hover:bg-gray-50">
                    {/* Gate Column */}
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {gate.gate_code}
                        </div>
                        <div className="text-xs text-gray-500">
                          {gate.warehouse_name}
                        </div>
                      </div>
                    </td>

                    {/* Count Up Cards Column (LOADING & VERIFYING) */}
                    <td className="px-6 py-4">
                      {activeAntrean.length === 0 ? (
                        <span className="text-gray-400 text-sm italic">
                          Tidak ada proses loading
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {activeAntrean.map((antrean) => (
                            <div
                              key={antrean.antrean_id}
                              className={cn(
                                "relative p-3 rounded-lg border-2 text-white w-[250px]",
                                getCardColor(antrean.status)
                              )}
                            >
                              {/* Status badge */}
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 text-xs bg-white/20 backdrop-blur rounded">
                                  {antrean.status}
                                </span>
                              </div>

                              {/* License plate number */}
                              <div className="font-bold text-lg mb-2">
                                {antrean.nopol}
                              </div>

                              {/* Bottom row */}
                              {antrean.status === AntreanStatusEnum.OPEN ? (
                                // For OPEN status, show "Waiting" label
                                <div className="text-sm font-medium italic opacity-80">
                                  Menunggu giliran...
                                </div>
                              ) : (
                                // For LOADING/VERIFYING, show count up timer
                                <div className="flex justify-between items-end">
                                  <div className="text-sm font-medium">
                                    {antrean.remaining_time_formatted.display}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Counter Column (OPEN status) */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-gray-700">
                          {openCount}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {openCount === 1 ? "truck" : "trucks"}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
