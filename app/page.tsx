'use client';

import React, { useState } from 'react';

export default function Page() {
  const [image, setImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [kernelX, setKernelX] = useState([
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ]);
  const [kernelY, setKernelY] = useState([
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ]);
  const [useBothKernels, setUseBothKernels] = useState(true);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    setImage(event.target?.result as string);
    setOutputImage(null);
  };
  reader.readAsDataURL(file);
};

  const handleKernelChange = (
  kernelSetter: React.Dispatch<React.SetStateAction<number[][]>>,
  i: number,
  j: number,
  value: string
) => {
  kernelSetter(prev => {
    const newKernel = [...prev];
    newKernel[i][j] = parseInt(value, 10) || 0;
    return newKernel;
  });
};

  const applyCustomEdgeDetection = () => {
    if (!image) return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      const gray = new Uint8ClampedArray(width * height);
      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        gray[i / 4] = avg;
      }

      const result = new Uint8ClampedArray(width * height);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0;
          let gy = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixel = gray[(y + ky) * width + (x + kx)];
              gx += pixel * kernelX[ky + 1][kx + 1];
              gy += pixel * kernelY[ky + 1][kx + 1];
            }
          }
          const value = useBothKernels ? Math.sqrt(gx * gx + gy * gy) : gx;
          result[y * width + x] = Math.max(0, Math.min(255, value));
        }
      }

      for (let i = 0; i < result.length; i++) {
        const v = result[i];
        data[i * 4] = v;
        data[i * 4 + 1] = v;
        data[i * 4 + 2] = v;
        data[i * 4 + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      setOutputImage(canvas.toDataURL());
    };
  };

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <h2>Ứng dụng phát hiện biên Sobel chuẩn (Liên hệ: cndhung@stcc.edu.vn)</h2>

      <label>
        Chọn ảnh đầu vào:
        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginLeft: 10 }} />
      </label>

      <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Tuỳ chọn Gx:
            <label style={{ fontWeight: 'normal' }}>
              <input
                type="checkbox"
                onChange={() => setKernelX([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])}
              />{' '}
              Mặc định
            </label>
          </h4>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {kernelX.map((row, i) => (
                <tr key={i}>
                  {row.map((value, j) => (
                    <td key={j}>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleKernelChange(setKernelX, i, j, e.target.value)}
                        style={{ width: 50, textAlign: 'center' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Tuỳ chọn Gy:
            <label style={{ fontWeight: 'normal' }}>
              <input
                type="checkbox"
                onChange={() => setKernelY([[-1, -2, -1], [0, 0, 0], [1, 2, 1]])}
              />{' '}
              Mặc định
            </label>
          </h4>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {kernelY.map((row, i) => (
                <tr key={i}>
                  {row.map((value, j) => (
                    <td key={j}>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleKernelChange(setKernelY, i, j, e.target.value)}
                        style={{ width: 50, textAlign: 'center' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label>
          <input
            type="checkbox"
            checked={useBothKernels}
            onChange={() => setUseBothKernels(!useBothKernels)}
          />{' '}
          Kết hợp cả Gx và Gy
        </label>
      </div>

      <div style={{
        border: '1px solid #ccc',
        padding: 10,
        borderRadius: 6,
        marginTop: 20,
        display: 'inline-block'
      }}>
        <button onClick={applyCustomEdgeDetection}>Thực hiện</button>
      </div>

      {image && (
        <div style={{ display: 'flex', gap: 20, marginTop: 30 }}>
          <div style={{ flex: 1 }}>
            <h4>Ảnh gốc:</h4>
            <img src={image} alt="Original" style={{ width: '100%' }} />
          </div>
          {outputImage && (
            <div style={{ flex: 1 }}>
              <h4>Ảnh phát hiện biên:</h4>
              <img src={outputImage} alt="Edges" style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
