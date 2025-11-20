import { protocol } from "electron";
import { AppModule } from "../AppModule.js";

export const LOCAL_FILE_PROTOCOL_SCHEME = "photon-file";

protocol.registerSchemesAsPrivileged([
  {
    scheme: LOCAL_FILE_PROTOCOL_SCHEME,
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

export function createLocalFileProtocolModule(): AppModule {
  return {
    async enable({ app }) {
      await app.whenReady();

      protocol.registerFileProtocol(
        LOCAL_FILE_PROTOCOL_SCHEME,
        (request, callback) => {
          try {
            const url = new URL(request.url);
            const encodedPath = url.searchParams.get("path");
            if (!encodedPath) {
              callback({ error: -6 });
              return;
            }

            const filePath = decodeURIComponent(encodedPath);
            callback(filePath);
          } catch (error) {
            console.error("解析本地图片路径失败:", error);
            callback({ error: -6 });
          }
        }
      );

    },
  };
}
