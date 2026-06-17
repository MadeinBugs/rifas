import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Salve o Suspiro — Ação Solidária pelo Suspiro";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [fontData, photoData] = await Promise.all([
    readFile(join(process.cwd(), "assets/Baloo2-Bold.woff")),
    readFile(join(process.cwd(), "public/photos/saudavel/paisagem-1.jpeg")),
  ]);

  const photoBase64 = `data:image/jpeg;base64,${photoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#4f444b",
        }}
      >
        {/* Foto de fundo */}
        <img
          src={photoBase64}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Gradiente escuro para legibilidade do texto */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)",
            display: "flex",
          }}
        />

        {/* Conteúdo de texto */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "56px 72px",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "Baloo 2",
              fontSize: 100,
              fontWeight: 700,
              color: "#fff7f1",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            Salve o Suspiro
          </span>
          <span
            style={{
              fontFamily: "Baloo 2",
              fontSize: 34,
              fontWeight: 700,
              color: "rgba(255,205,178,0.92)",
              textAlign: "center",
            }}
          >
            Ajude no tratamento do Suspiro — ação entre amigos 💛
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Baloo 2",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
