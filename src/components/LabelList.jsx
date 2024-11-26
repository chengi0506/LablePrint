import React, { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Footer from "./Footer";
import Swal from "sweetalert2";
import "./LabelList.css";

const LabelList = () => {
  const [labelData, setLabelData] = useState([]);
  const [type, setType] = useState("準備金經辦");
  const [status, setStatus] = useState("鈞啟");
  const [currentPage, setCurrentPage] = useState(1);
  const labelsPerPage = 14; // 每頁顯示的標籤數量

  // 添加間距設定的 state
  const [spacing, setSpacing] = useState({
    topMargin: 15, // 上邊距 (mm)
    leftMargin: 10, // 左邊距 (mm)
    labelHeight: 38, // 標籤高度 (mm)
    labelWidth: 95, // 標籤寬度 (mm)
    codeGap: 5, // 代碼與地址間距 (mm)
    nameGap: 5, // 名稱與ID間距 (mm)
    typeGap: 5, // 類型與狀態間距 (mm)
    lineGap: 2, // 行間距 (mm)
    colGap: 5, // 欄間距 (mm)
    rowGap: 0, // 列間距 (mm)
    cols: 2, // 欄數
    rows: 7, // 列數
  });

  // 處理間距變更
  const handleSpacingChange = (field, value) => {
    setSpacing((prev) => ({
      ...prev,
      [field]: Number(value),
    }));
  };

  // 處理文件上傳
  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    // 檢查檔案名稱
    if (file && file.name.toLowerCase() !== "label.txt") {
      Swal.fire({
        icon: "error",
        title: "檔案錯誤",
        text: "請上傳名為 label.txt 的檔案",
        confirmButtonText: "確定",
        confirmButtonColor: "#4299e1",
      });
      event.target.value = ""; // 清空檔案選擇
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split("\n");
        const parsedData = lines
          .filter((line) => line.trim())
          .map((line) => {
            const [code, address, name, zip] = line.split(",");
            return {
              code: code.trim(),
              address: address.trim(),
              name: name.trim(),
              zip: zip.trim(),
              type,
              status,
            };
          });
        setLabelData(parsedData);
        setCurrentPage(1);

        // 顯示成功訊息
        Swal.fire({
          icon: "success",
          title: "檔案上傳成功",
          text: `已成功讀取 ${parsedData.length} 筆資料`,
          showConfirmButton: false,
          timer: 1500,
        });
      };
      reader.readAsText(file);
    }
  };

  // 計算總頁數
  const totalPages = Math.ceil(labelData.length / labelsPerPage);

  // 獲取當前頁的數據
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * labelsPerPage;
    const pageData = labelData.slice(startIndex, startIndex + labelsPerPage);

    // 填充空白項目到 14 個
    const filledData = [...pageData];
    while (filledData.length < labelsPerPage) {
      filledData.push({ empty: true });
    }
    return filledData;
  };

  // 頁面導航函數
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  // 生成分頁按鈕
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`page-button ${currentPage === i ? "active" : ""}`}
        >
          第 {i} 頁
        </button>
      );
    }
    return pages;
  };

  const generatePDF = async () => {
    if (labelData.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "無法產生標籤",
        text: "請先上傳資料檔案",
        confirmButtonText: "確定",
        confirmButtonColor: "#4299e1",
      });
      return;
    }

    try {
      // 顯示載入中訊息
      Swal.fire({
        title: "製作標籤中...",
        html: "請稍候",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // 生成檔名
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const fileName = `labels_${year}${month}${day}${hours}${minutes}.pdf`;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const labelsPerPage = 14;
      const totalPages = Math.ceil(labelData.length / labelsPerPage);

      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        const tempContainer = document.createElement("div");
        tempContainer.style.width = "210mm";
        tempContainer.style.height = "297mm";
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.background = "white";
        tempContainer.style.padding = `${spacing.topMargin}mm ${spacing.leftMargin}mm`;
        tempContainer.style.boxSizing = "border-box";
        tempContainer.style.fontFamily =
          '"Microsoft JhengHei", "微軟正黑體", sans-serif';

        const gridContainer = document.createElement("div");
        gridContainer.style.display = "grid";
        gridContainer.style.gridTemplateColumns = `repeat(${spacing.cols}, ${spacing.labelWidth}mm)`;
        gridContainer.style.gridTemplateRows = `repeat(${spacing.rows}, ${spacing.labelHeight}mm)`;
        gridContainer.style.gap = `${spacing.rowGap}mm ${spacing.colGap}mm`;
        gridContainer.style.justifyContent = "center";
        tempContainer.appendChild(gridContainer);

        const pageData = labelData.slice(
          pageNum * labelsPerPage,
          (pageNum + 1) * labelsPerPage
        );

        const filledData = [...pageData];
        while (filledData.length < labelsPerPage) {
          filledData.push({ empty: true });
        }

        filledData.forEach((item) => {
          const labelDiv = document.createElement("div");
          labelDiv.style.padding = "5mm";
          labelDiv.style.boxSizing = "border-box";
          labelDiv.style.height = `${spacing.labelHeight}mm`;
          labelDiv.style.visibility = item.empty ? "hidden" : "visible";

          if (!item.empty) {
            labelDiv.innerHTML = `
              <div style="display: flex; margin-bottom: ${spacing.lineGap}mm;">
                <span style="font-size: 14px; min-width: 25px; margin-right: ${spacing.codeGap}mm;">${item.code}</span>
                <span style="font-size: 14px;">${item.address}</span>
              </div>
              <div style="margin-left: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: ${spacing.lineGap}mm;">
                  <span style="font-size: 14px;">${item.name}</span>
                  <span style="font-size: 14px; margin-left: ${spacing.nameGap}mm;">${item.zip}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 14px;">${type}</span>
                  <span style="font-size: 14px; margin-left: ${spacing.typeGap}mm;">${status}</span>
                </div>
              </div>
            `;
          }
          gridContainer.appendChild(labelDiv);
        });

        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: 210 * 3.78,
          height: 297 * 3.78,
          backgroundColor: "white",
        });

        document.body.removeChild(tempContainer);

        if (pageNum > 0) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
      }

      // 使用新的檔名儲存
      pdf.save(fileName);

      // 標籤生成完成後
      Swal.fire({
        icon: "success",
        title: "標籤製作成功",
        text: `檔案 ${fileName} 已準備好下載`,
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({
        icon: "error",
        title: "標籤製作失敗",
        text: "發生錯誤，請稍後再試",
        confirmButtonText: "確定",
        confirmButtonColor: "#4299e1",
      });
    }
  };

  return (
    <>
      <div className="label-container">
        <div className="header">
          <h1>信封用標籤列印系統</h1>
        </div>

        <div className="controls">
          <div className="input-group">
            <label>上傳TXT檔案 (請上傳 label.txt)</label>
            <input type="file" accept=".txt" onChange={handleFileUpload} />
            <small className="file-hint">* 檔案名稱必須為 label.txt</small>
          </div>

          <div className="input-group">
            <label>收件人</label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="請輸入收件人"
            />
          </div>

          <div className="input-group">
            <label>信封用語</label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="請輸入信封用語"
            />
          </div>

          {/* 新增間距設定區域 */}
          <div className="spacing-controls">
            <h3>版面配置設定 (mm)</h3>
            <div className="spacing-grid">
              <div className="spacing-item">
                <label>上邊距</label>
                <input
                  type="number"
                  value={spacing.topMargin}
                  onChange={(e) =>
                    handleSpacingChange("topMargin", e.target.value)
                  }
                  min="0"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>左邊距</label>
                <input
                  type="number"
                  value={spacing.leftMargin}
                  onChange={(e) =>
                    handleSpacingChange("leftMargin", e.target.value)
                  }
                  min="0"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>標籤寬度</label>
                <input
                  type="number"
                  value={spacing.labelWidth}
                  onChange={(e) =>
                    handleSpacingChange("labelWidth", e.target.value)
                  }
                  min="50"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>標籤高度</label>
                <input
                  type="number"
                  value={spacing.labelHeight}
                  onChange={(e) =>
                    handleSpacingChange("labelHeight", e.target.value)
                  }
                  min="20"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>欄數</label>
                <input
                  type="number"
                  value={spacing.cols}
                  onChange={(e) => handleSpacingChange("cols", e.target.value)}
                  min="1"
                  max="3"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>列數</label>
                <input
                  type="number"
                  value={spacing.rows}
                  onChange={(e) => handleSpacingChange("rows", e.target.value)}
                  min="1"
                  max="10"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>欄間距</label>
                <input
                  type="number"
                  value={spacing.colGap}
                  onChange={(e) =>
                    handleSpacingChange("colGap", e.target.value)
                  }
                  min="0"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>列間距</label>
                <input
                  type="number"
                  value={spacing.rowGap}
                  onChange={(e) =>
                    handleSpacingChange("rowGap", e.target.value)
                  }
                  min="0"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>代碼間距</label>
                <input
                  type="number"
                  value={spacing.codeGap}
                  onChange={(e) =>
                    handleSpacingChange("codeGap", e.target.value)
                  }
                  min="0"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>名稱間距</label>
                <input
                  type="number"
                  value={spacing.nameGap}
                  onChange={(e) =>
                    handleSpacingChange("nameGap", e.target.value)
                  }
                  min="0"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>類型間距</label>
                <input
                  type="number"
                  value={spacing.typeGap}
                  onChange={(e) =>
                    handleSpacingChange("typeGap", e.target.value)
                  }
                  min="0"
                  step="1"
                />
              </div>
              <div className="spacing-item">
                <label>行間距</label>
                <input
                  type="number"
                  value={spacing.lineGap}
                  onChange={(e) =>
                    handleSpacingChange("lineGap", e.target.value)
                  }
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>

          <div className="button-container">
            <button onClick={generatePDF}>產生標籤</button>
          </div>
        </div>

        {labelData.length > 0 && (
          <>
            <div className="pagination">{renderPagination()}</div>
            <div className="page-info">
              第 {currentPage} 頁，共 {totalPages} 頁
            </div>

            <div className="preview-container">
              {/* 添加尺寸標示 */}
              <div className="size-indicators">
                <div className="width-indicator">
                  <span className="size-label">寬度: {210}mm</span>
                  <div className="arrow-line horizontal"></div>
                </div>
                <div className="height-indicator">
                  <span className="size-label">高度: {297}mm</span>
                  <div className="arrow-line vertical"></div>
                </div>
              </div>

              {/* 標籤尺寸指示器 */}
              <div className="label-size-indicator">
                <span className="size-label">
                  標籤尺寸: {spacing.labelWidth}x{spacing.labelHeight}mm
                </span>
              </div>

              <div
                className="print-content"
                style={{
                  padding: `${spacing.topMargin}mm ${spacing.leftMargin}mm`,
                }}
              >
                {/* 添加邊距標示 */}
                <div className="margin-indicators">
                  <div className="top-margin">
                    <span className="margin-label">{spacing.topMargin}mm</span>
                  </div>
                  <div className="left-margin">
                    <span className="margin-label">{spacing.leftMargin}mm</span>
                  </div>
                </div>

                <div
                  className="labels-grid"
                  style={{
                    gridTemplateColumns: `repeat(${spacing.cols}, ${spacing.labelWidth}mm)`,
                    gridTemplateRows: `repeat(${spacing.rows}, ${spacing.labelHeight}mm)`,
                    gap: `${spacing.rowGap}mm ${spacing.colGap}mm`,
                    justifyContent: "center",
                  }}
                >
                  {getCurrentPageData().map((item, index) => (
                    <div
                      key={index}
                      className="label-item"
                      style={{
                        height: `${spacing.labelHeight}mm`,
                        visibility: item.empty ? "hidden" : "visible",
                        position: "relative",
                      }}
                    >
                      {!item.empty && (
                        <>
                          {/* 添加間距指示器 */}
                          <div className="spacing-indicators">
                            {/* 代碼間距指示器 */}
                            <div
                              className="spacing-indicator code-gap"
                              style={{
                                left: "25px",
                                top: "-5px",
                                width: `${spacing.codeGap}mm`,
                              }}
                            >
                              <span className="indicator-label">
                                {spacing.codeGap}mm
                              </span>
                              <div className="indicator-line"></div>
                            </div>

                            {/* 名稱間距指示器 */}
                            <div
                              className="spacing-indicator name-gap"
                              style={{
                                right: "10px",
                                top: "20px",
                                width: `${spacing.nameGap}mm`,
                              }}
                            >
                              <span className="indicator-label">
                                {spacing.nameGap}mm
                              </span>
                              <div className="indicator-line"></div>
                            </div>

                            {/* 類型間距指示器 */}
                            <div
                              className="spacing-indicator type-gap"
                              style={{
                                right: "10px",
                                bottom: "5px",
                                width: `${spacing.typeGap}mm`,
                              }}
                            >
                              <span className="indicator-label">
                                {spacing.typeGap}mm
                              </span>
                              <div className="indicator-line"></div>
                            </div>

                            {/* 行間距指示器 */}
                            <div
                              className="spacing-indicator line-gap"
                              style={{
                                left: "-15px",
                                height: `${spacing.lineGap}mm`,
                              }}
                            >
                              <span className="indicator-label">
                                {spacing.lineGap}mm
                              </span>
                              <div className="indicator-line vertical"></div>
                            </div>
                          </div>

                          {/* 原有的標籤內容 */}
                          <div
                            className="label-header"
                            style={{
                              marginBottom: `${spacing.lineGap}mm`,
                            }}
                          >
                            <span
                              className="code"
                              style={{
                                marginRight: `${spacing.codeGap}mm`,
                              }}
                            >
                              {item.code}
                            </span>
                            <span className="address">{item.address}</span>
                          </div>
                          <div className="label-body">
                            <div
                              className="org-info"
                              style={{
                                marginBottom: `${spacing.lineGap}mm`,
                              }}
                            >
                              <span className="name">{item.name}</span>
                              <span
                                className="id"
                                style={{
                                  marginLeft: `${spacing.nameGap}mm`,
                                }}
                              >
                                {item.id}
                              </span>
                            </div>
                            <div className="status-info">
                              <span className="type">{type}</span>
                              <span
                                className="status"
                                style={{
                                  marginLeft: `${spacing.typeGap}mm`,
                                }}
                              >
                                {status}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default LabelList;
