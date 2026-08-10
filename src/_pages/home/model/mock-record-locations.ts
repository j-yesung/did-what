export type MockRecordLocation = {
  id: string;
  latitude: number;
  longitude: number;
};

export const MOCK_RECORD_LOCATIONS = [
  { id: "seongsu-1", latitude: 37.5445, longitude: 127.0557 },
  { id: "seongsu-2", latitude: 37.5448, longitude: 127.0562 },
  { id: "seongsu-3", latitude: 37.5442, longitude: 127.0554 },
  { id: "seongsu-4", latitude: 37.545, longitude: 127.056 },
  { id: "seongsu-5", latitude: 37.5446, longitude: 127.0559 },
  { id: "seongsu-6", latitude: 37.5443, longitude: 127.0561 },
  { id: "seongsu-7", latitude: 37.5449, longitude: 127.0555 },
  { id: "mokpo-1", latitude: 34.8118, longitude: 126.3922 },
  { id: "mokpo-2", latitude: 34.8121, longitude: 126.3925 },
  { id: "mokpo-3", latitude: 34.8115, longitude: 126.3919 },
  { id: "mokpo-4", latitude: 34.8119, longitude: 126.3924 },
  { id: "busan-1", latitude: 35.1532, longitude: 129.1187 },
  { id: "busan-2", latitude: 35.1535, longitude: 129.1184 },
  { id: "jeju-1", latitude: 33.4996, longitude: 126.5312 },
] satisfies MockRecordLocation[];
