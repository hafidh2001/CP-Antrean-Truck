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
        startPolling(1000); // Update countdown every second
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

  const getCardColor = (hours: number, minutes: number, seconds: number) => {
    // If all time is 0, show gray (completed)
    if (hours === 0 && minutes === 0 && seconds === 0)
      return "bg-gray-400 border-gray-500";
    if (hours > 0) return "bg-blue-500 border-blue-600"; // Still have hours
    if (minutes > 0) return "bg-yellow-500 border-yellow-600"; // Only minutes left
    return "bg-red-500 border-red-600"; // Only seconds left
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {gates.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada antrean truck saat ini
                </td>
              </tr>
            ) : (
              gates.map((gate) => (
                <tr key={gate.gate_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {gate.gate_code}
                      </div>
                      <div className="text-xs text-gray-500">
                        {gate.warehouse_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {gate.antrean_list.length === 0 ? (
                      <span className="text-gray-400 text-sm italic">
                        Tidak ada antrean
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {gate.antrean_list.map((antrean) => (
                          <div
                            key={antrean.antrean_id}
                            className={cn(
                              "relative p-3 rounded-lg border-2 text-white w-[250px]",
                              getCardColor(
                                antrean.remaining_time_formatted.hours,
                                antrean.remaining_time_formatted.minutes,
                                antrean.remaining_time_formatted.seconds
                              )
                            )}
                          >
                            {/* Status badge only for VERIFYING */}
                            {antrean.status === AntreanStatusEnum.VERIFYING && (
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 text-xs bg-white/20 backdrop-blur rounded">
                                  VERIFYING
                                </span>
                              </div>
                            )}

                            {/* License plate number */}
                            <div className="font-bold text-lg mb-2">
                              {antrean.nopol}
                            </div>

                            {/* Bottom row */}
                            <div className="flex justify-between items-end">
                              {/* Countdown timer */}
                              <div className="text-sm font-medium">
                                {antrean.remaining_time_formatted.display}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
