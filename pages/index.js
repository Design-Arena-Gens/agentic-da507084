import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Head from 'next/head';

export default function Home() {
  const [data, setData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const processFile = useCallback((file) => {
    if (!file) return;
    
    const validExtensions = ['.xlsx', '.xls', '.csv', '.ods'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Format non supporté. Utilisez .xlsx, .xls, .csv ou .ods');
      return;
    }

    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheetNames = workbook.SheetNames;
        setSheets(sheetNames);
        setActiveSheet(sheetNames[0]);
        
        const allData = {};
        sheetNames.forEach((name) => {
          const worksheet = workbook.Sheets[name];
          allData[name] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        });
        setData(allData);
      } catch (err) {
        setError('Erreur lors de la lecture du fichier: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const clearFile = () => {
    setData(null);
    setFileName('');
    setSheets([]);
    setActiveSheet('');
    setError('');
  };

  return (
    <>
      <Head>
        <title>Visualiseur Excel</title>
        <meta name="description" content="Téléchargez et visualisez vos fichiers Excel" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container">
        <h1>📊 Visualiseur de Fichiers Excel</h1>
        <p className="subtitle">Téléchargez un fichier Excel (.xlsx, .xls, .csv, .ods) pour le visualiser</p>

        {!data ? (
          <div
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="dropzone-content">
              <div className="icon">📁</div>
              <p>Glissez-déposez votre fichier ici</p>
              <p className="or">ou</p>
              <label className="file-label">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.ods"
                  onChange={handleFileUpload}
                  hidden
                />
                <span className="btn">Parcourir les fichiers</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="file-info">
            <span className="file-name">📄 {fileName}</span>
            <button onClick={clearFile} className="btn btn-secondary">
              Nouveau fichier
            </button>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {data && sheets.length > 1 && (
          <div className="tabs">
            {sheets.map((sheet) => (
              <button
                key={sheet}
                className={`tab ${activeSheet === sheet ? 'active' : ''}`}
                onClick={() => setActiveSheet(sheet)}
              >
                {sheet}
              </button>
            ))}
          </div>
        )}

        {data && data[activeSheet] && (
          <div className="table-container">
            <table>
              <thead>
                {data[activeSheet][0] && (
                  <tr>
                    <th className="row-number">#</th>
                    {data[activeSheet][0].map((cell, index) => (
                      <th key={index}>{cell || `Colonne ${index + 1}`}</th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {data[activeSheet].slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="row-number">{rowIndex + 1}</td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data[activeSheet].length > 1 && (
              <p className="row-count">
                {data[activeSheet].length - 1} ligne(s) • {data[activeSheet][0]?.length || 0} colonne(s)
              </p>
            )}
          </div>
        )}

        <style jsx global>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
            font-size: 2rem;
          }

          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
          }

          .dropzone {
            border: 3px dashed #ccc;
            border-radius: 12px;
            padding: 60px 20px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            background: #fafafa;
          }

          .dropzone:hover,
          .dropzone.dragging {
            border-color: #667eea;
            background: #f0f4ff;
          }

          .dropzone-content .icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }

          .dropzone-content p {
            color: #666;
            margin-bottom: 10px;
          }

          .dropzone-content .or {
            color: #999;
            font-size: 0.9rem;
          }

          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-top: 10px;
          }

          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }

          .btn-secondary {
            background: #6c757d;
          }

          .btn-secondary:hover {
            box-shadow: 0 4px 15px rgba(108, 117, 125, 0.4);
          }

          .file-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 20px;
          }

          .file-name {
            font-weight: 500;
            color: #333;
          }

          .error {
            background: #fee;
            color: #c00;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }

          .tabs {
            display: flex;
            gap: 5px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }

          .tab {
            padding: 10px 20px;
            border: none;
            background: #e9ecef;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
          }

          .tab:hover {
            background: #dee2e6;
          }

          .tab.active {
            background: #667eea;
            color: white;
          }

          .table-container {
            overflow-x: auto;
            border: 1px solid #e9ecef;
            border-radius: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
          }

          th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
            white-space: nowrap;
          }

          th {
            background: #667eea;
            color: white;
            font-weight: 600;
            position: sticky;
            top: 0;
          }

          .row-number {
            background: #f8f9fa;
            color: #666;
            font-weight: 500;
            width: 50px;
            text-align: center;
          }

          th.row-number {
            background: #5a6fd6;
          }

          tr:hover td {
            background: #f8f9fa;
          }

          tr:hover td.row-number {
            background: #e9ecef;
          }

          .row-count {
            text-align: center;
            padding: 15px;
            color: #666;
            font-size: 0.9rem;
            background: #f8f9fa;
          }

          @media (max-width: 768px) {
            .container {
              padding: 15px;
            }

            h1 {
              font-size: 1.5rem;
            }

            .dropzone {
              padding: 40px 15px;
            }

            .file-info {
              flex-direction: column;
              gap: 10px;
              text-align: center;
            }

            th, td {
              padding: 8px 10px;
              font-size: 0.8rem;
            }
          }
        `}</style>
      </main>
    </>
  );
}
