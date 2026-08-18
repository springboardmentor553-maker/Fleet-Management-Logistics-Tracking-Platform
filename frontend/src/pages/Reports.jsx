import { useEffect, useState } from "react";

import api from "../api/api";

import {
  FaChartBar,
  FaTruck,
  FaUserTie,
  FaBoxOpen,
  FaPrint,
  FaFileExcel,
  FaFilePdf,
  FaDownload,
  FaCalendarAlt,
} from "react-icons/fa";

function Reports() {
  // =====================================================
  // REPORT STATE
  // =====================================================

  const [report, setReport] = useState({
    vehicles: 0,
    drivers: 0,
    shipments: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [exportingExcel, setExportingExcel] =
    useState(false);

  const [exportingPDF, setExportingPDF] =
    useState(false);


  // =====================================================
  // FETCH REPORT
  // =====================================================

  useEffect(() => {
    fetchReport();
  }, []);


  const fetchReport = async () => {

    try {

      setLoading(true);

      const res =
        await api.get("/reports");

      console.log(
        "Reports API Response:",
        res.data
      );

      setReport({
        vehicles:
          Number(
            res.data?.vehicles
          ) || 0,

        drivers:
          Number(
            res.data?.drivers
          ) || 0,

        shipments:
          Number(
            res.data?.shipments
          ) || 0,
      });

    } catch (error) {

      console.error(
        "Failed to load report:",
        error
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // EXPORT EXCEL
  // =====================================================

  const exportExcel = async () => {

    try {

      setExportingExcel(true);

      const response =
        await api.get(
          "/reports/export/excel",
          {
            responseType:
              "blob",
          }
        );

      const blob =
        new Blob(
          [response.data],
          {
            type:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }
        );

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.setAttribute(
        "download",
        "vehicle_report.xlsx"
      );

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );

    } catch (error) {

      console.error(
        "Excel Export Error:",
        error
      );

      alert(
        "Failed to export Excel."
      );

    } finally {

      setExportingExcel(false);

    }
  };


  // =====================================================
  // EXPORT PDF
  // =====================================================

  const exportPDF = async () => {

    try {

      setExportingPDF(true);

      const response =
        await api.get(
          "/reports/export/pdf",
          {
            responseType:
              "blob",
          }
        );

      const blob =
        new Blob(
          [response.data],
          {
            type:
              "application/pdf",
          }
        );

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.setAttribute(
        "download",
        "vehicle_report.pdf"
      );

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );

    } catch (error) {

      console.error(
        "PDF Export Error:",
        error
      );

      alert(
        "Failed to export PDF."
      );

    } finally {

      setExportingPDF(false);

    }
  };


  // =====================================================
  // PRINT
  // =====================================================

  const printReport = () => {
    window.print();
  };


  // =====================================================
  // CURRENT DATE
  // =====================================================

  const currentDate =
    new Date().toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <main
        className="reports-page"
        style={{
          minHeight:
            "100vh",

          background:
            "#f4f7fb",
        }}
      >

        <div
          className="container-fluid p-5 text-center"
        >

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <p
            className="text-muted mt-3"
          >
            Loading reports...
          </p>

        </div>

      </main>
    );
  }


  // =====================================================
  // MAIN UI
  // =====================================================

  return (

    <main
      className="reports-page"
      style={{
        minHeight:
          "100vh",

        background:
          "#f4f7fb",
      }}
    >

      <div
        className="container-fluid"
        style={{
          padding:
            "30px",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="d-flex justify-content-between align-items-center mb-4"
        >

          <div>

            <h2
              className="fw-bold mb-1"
              style={{
                color:
                  "#172033",

                fontSize:
                  "30px",
              }}
            >

              <FaChartBar
                className="me-2"
                style={{
                  color:
                    "#2563eb",
                }}
              />

              Reports

            </h2>

            <p className="text-muted mb-0">

              View fleet statistics and
              generate management reports.

            </p>

          </div>


          {/* DATE */}

          <div
            className="d-flex align-items-center"
            style={{
              background:
                "white",

              padding:
                "10px 15px",

              borderRadius:
                "10px",

              boxShadow:
                "0 4px 14px rgba(15,23,42,0.06)",
            }}
          >

            <FaCalendarAlt
              className="me-2"
              style={{
                color:
                  "#2563eb",
              }}
            />

            <span
              className="text-muted"
              style={{
                fontSize:
                  "14px",

                fontWeight:
                  "500",
              }}
            >

              {currentDate}

            </span>

          </div>

        </div>


        {/* =================================================
            SUMMARY TITLE
        ================================================= */}

        <div className="mb-3">

          <h5
            className="fw-bold mb-1"
            style={{
              color:
                "#172033",
            }}
          >
            Fleet Summary
          </h5>

          <p
            className="text-muted mb-0"
            style={{
              fontSize:
                "14px",
            }}
          >
            Current fleet statistics
          </p>

        </div>


        {/* =================================================
            STATISTICS CARDS
        ================================================= */}

        <div
          className="row g-4 mb-4"
        >

          {/* =================================================
              VEHICLES
          ================================================= */}

          <div
            className="col-lg-4 col-md-6"
          >

            <div
              className="card border-0 h-100"
              style={{
                borderRadius:
                  "16px",

                overflow:
                  "hidden",

                boxShadow:
                  "0 6px 22px rgba(15,23,42,0.08)",

                cursor:
                  "pointer",

                transition:
                  "all 0.25s ease",
              }}

              onMouseEnter={(e) => {

                e.currentTarget.style.transform =
                  "translateY(-5px)";

                e.currentTarget.style.boxShadow =
                  "0 12px 28px rgba(15,23,42,0.12)";

              }}

              onMouseLeave={(e) => {

                e.currentTarget.style.transform =
                  "translateY(0)";

                e.currentTarget.style.boxShadow =
                  "0 6px 22px rgba(15,23,42,0.08)";

              }}
            >

              <div
                className="card-body p-4"
              >

                <div
                  className="d-flex justify-content-between align-items-start"
                >

                  <div>

                    <p
                      className="text-muted mb-2"
                      style={{
                        fontSize:
                          "14px",

                        fontWeight:
                          "600",
                      }}
                    >
                      TOTAL VEHICLES
                    </p>

                    <h1
                      className="fw-bold mb-1"
                      style={{
                        color:
                          "#172033",
                      }}
                    >
                      {report.vehicles}
                    </h1>

                    <small className="text-muted">
                      Registered vehicles
                    </small>

                  </div>


                  <div
                    style={{
                      width:
                        "58px",

                      height:
                        "58px",

                      borderRadius:
                        "14px",

                      background:
                        "#eff6ff",

                      color:
                        "#2563eb",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      fontSize:
                        "24px",
                    }}
                  >

                    <FaTruck />

                  </div>

                </div>


                <div
                  className="mt-4"
                  style={{
                    height:
                      "4px",

                    background:
                      "#2563eb",

                    borderRadius:
                      "10px",

                    width:
                      "100%",
                  }}
                />

              </div>

            </div>

          </div>


          {/* =================================================
              DRIVERS
          ================================================= */}

          <div
            className="col-lg-4 col-md-6"
          >

            <div
              className="card border-0 h-100"
              style={{
                borderRadius:
                  "16px",

                overflow:
                  "hidden",

                boxShadow:
                  "0 6px 22px rgba(15,23,42,0.08)",

                cursor:
                  "pointer",

                transition:
                  "all 0.25s ease",
              }}

              onMouseEnter={(e) => {

                e.currentTarget.style.transform =
                  "translateY(-5px)";

                e.currentTarget.style.boxShadow =
                  "0 12px 28px rgba(15,23,42,0.12)";

              }}

              onMouseLeave={(e) => {

                e.currentTarget.style.transform =
                  "translateY(0)";

                e.currentTarget.style.boxShadow =
                  "0 6px 22px rgba(15,23,42,0.08)";

              }}
            >

              <div
                className="card-body p-4"
              >

                <div
                  className="d-flex justify-content-between align-items-start"
                >

                  <div>

                    <p
                      className="text-muted mb-2"
                      style={{
                        fontSize:
                          "14px",

                        fontWeight:
                          "600",
                      }}
                    >
                      TOTAL DRIVERS
                    </p>

                    <h1
                      className="fw-bold mb-1"
                      style={{
                        color:
                          "#172033",
                      }}
                    >
                      {report.drivers}
                    </h1>

                    <small className="text-muted">
                      Registered drivers
                    </small>

                  </div>


                  <div
                    style={{
                      width:
                        "58px",

                      height:
                        "58px",

                      borderRadius:
                        "14px",

                      background:
                        "#ecfdf5",

                      color:
                        "#10b981",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      fontSize:
                        "24px",
                    }}
                  >

                    <FaUserTie />

                  </div>

                </div>


                <div
                  className="mt-4"
                  style={{
                    height:
                      "4px",

                    background:
                      "#10b981",

                    borderRadius:
                      "10px",

                    width:
                      "100%",
                  }}
                />

              </div>

            </div>

          </div>


          {/* =================================================
              SHIPMENTS
          ================================================= */}

          <div
            className="col-lg-4 col-md-6"
          >

            <div
              className="card border-0 h-100"
              style={{
                borderRadius:
                  "16px",

                overflow:
                  "hidden",

                boxShadow:
                  "0 6px 22px rgba(15,23,42,0.08)",

                cursor:
                  "pointer",

                transition:
                  "all 0.25s ease",
              }}

              onMouseEnter={(e) => {

                e.currentTarget.style.transform =
                  "translateY(-5px)";

                e.currentTarget.style.boxShadow =
                  "0 12px 28px rgba(15,23,42,0.12)";

              }}

              onMouseLeave={(e) => {

                e.currentTarget.style.transform =
                  "translateY(0)";

                e.currentTarget.style.boxShadow =
                  "0 6px 22px rgba(15,23,42,0.08)";

              }}
            >

              <div
                className="card-body p-4"
              >

                <div
                  className="d-flex justify-content-between align-items-start"
                >

                  <div>

                    <p
                      className="text-muted mb-2"
                      style={{
                        fontSize:
                          "14px",

                        fontWeight:
                          "600",
                      }}
                    >
                      TOTAL SHIPMENTS
                    </p>

                    <h1
                      className="fw-bold mb-1"
                      style={{
                        color:
                          "#172033",
                      }}
                    >
                      {report.shipments}
                    </h1>

                    <small className="text-muted">
                      All shipments
                    </small>

                  </div>


                  <div
                    style={{
                      width:
                        "58px",

                      height:
                        "58px",

                      borderRadius:
                        "14px",

                      background:
                        "#fff7ed",

                      color:
                        "#f97316",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      fontSize:
                        "24px",
                    }}
                  >

                    <FaBoxOpen />

                  </div>

                </div>


                <div
                  className="mt-4"
                  style={{
                    height:
                      "4px",

                    background:
                      "#f97316",

                    borderRadius:
                      "10px",

                    width:
                      "100%",
                  }}
                />

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            EXPORT SECTION
        ================================================= */}

        <div
          className="card border-0 mb-4"
          style={{
            borderRadius:
              "16px",

            boxShadow:
              "0 6px 22px rgba(15,23,42,0.08)",
          }}
        >

          <div
            className="card-body p-4"
          >

            <div
              className="d-flex justify-content-between align-items-center mb-4"
            >

              <div>

                <h5
                  className="fw-bold mb-1"
                  style={{
                    color:
                      "#172033",
                  }}
                >
                  Generate Report
                </h5>

                <p
                  className="text-muted mb-0"
                  style={{
                    fontSize:
                      "14px",
                  }}
                >
                  Download or print your
                  fleet information.
                </p>

              </div>


              <FaDownload
                style={{
                  fontSize:
                    "25px",

                  color:
                    "#2563eb",
                }}
              />

            </div>


            <div
              className="row g-3"
            >

              {/* PRINT */}

              <div
                className="col-md-4"
              >

                <button
                  type="button"
                  onClick={
                    printReport
                  }
                  className="btn w-100"
                  style={{
                    background:
                      "#f1f5f9",

                    color:
                      "#334155",

                    border:
                      "1px solid #e2e8f0",

                    borderRadius:
                      "10px",

                    padding:
                      "12px",

                    fontWeight:
                      "600",

                    transition:
                      "all 0.2s ease",
                  }}

                  onMouseEnter={(e) => {

                    e.currentTarget.style.transform =
                      "translateY(-2px)";

                    e.currentTarget.style.background =
                      "#e2e8f0";

                  }}

                  onMouseLeave={(e) => {

                    e.currentTarget.style.transform =
                      "translateY(0)";

                    e.currentTarget.style.background =
                      "#f1f5f9";

                  }}
                >

                  <FaPrint
                    className="me-2"
                  />

                  Print Report

                </button>

              </div>


              {/* EXCEL */}

              <div
                className="col-md-4"
              >

                <button
                  type="button"
                  onClick={
                    exportExcel
                  }
                  disabled={
                    exportingExcel
                  }
                  className="btn w-100"
                  style={{
                    background:
                      "#dcfce7",

                    color:
                      "#15803d",

                    border:
                      "none",

                    borderRadius:
                      "10px",

                    padding:
                      "12px",

                    fontWeight:
                      "600",

                    transition:
                      "all 0.2s ease",

                    opacity:
                      exportingExcel
                        ? 0.7
                        : 1,
                  }}
                >

                  <FaFileExcel
                    className="me-2"
                  />

                  {exportingExcel
                    ? "Exporting..."
                    : "Export Excel"}

                </button>

              </div>


              {/* PDF */}

              <div
                className="col-md-4"
              >

                <button
                  type="button"
                  onClick={
                    exportPDF
                  }
                  disabled={
                    exportingPDF
                  }
                  className="btn w-100"
                  style={{
                    background:
                      "#fee2e2",

                    color:
                      "#dc2626",

                    border:
                      "none",

                    borderRadius:
                      "10px",

                    padding:
                      "12px",

                    fontWeight:
                      "600",

                    transition:
                      "all 0.2s ease",

                    opacity:
                      exportingPDF
                        ? 0.7
                        : 1,
                  }}
                >

                  <FaFilePdf
                    className="me-2"
                  />

                  {exportingPDF
                    ? "Exporting..."
                    : "Export PDF"}

                </button>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            REPORT PREVIEW
        ================================================= */}

        <div
          className="card border-0"
          style={{
            borderRadius:
              "16px",

            boxShadow:
              "0 6px 22px rgba(15,23,42,0.08)",
          }}
        >

          <div
            className="card-body p-4"
          >

            <div
              className="d-flex align-items-center mb-4"
            >

              <div
                style={{
                  width:
                    "45px",

                  height:
                    "45px",

                  borderRadius:
                    "12px",

                  background:
                    "#eff6ff",

                  color:
                    "#2563eb",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  marginRight:
                    "12px",
                }}
              >

                <FaChartBar />

              </div>


              <div>

                <h5
                  className="fw-bold mb-0"
                  style={{
                    color:
                      "#172033",
                  }}
                >
                  Report Overview
                </h5>

                <small className="text-muted">
                  Current fleet data
                </small>

              </div>

            </div>


            <div
              className="table-responsive"
            >

              <table
                className="table align-middle"
              >

                <thead
                  style={{
                    background:
                      "#f8fafc",
                  }}
                >

                  <tr>

                    <th>
                      Category
                    </th>

                    <th>
                      Total
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {/* VEHICLES */}

                  <tr>

                    <td>

                      <FaTruck
                        className="me-2"
                        style={{
                          color:
                            "#2563eb",
                        }}
                      />

                      Vehicles

                    </td>

                    <td
                      className="fw-bold"
                    >
                      {report.vehicles}
                    </td>

                    <td>

                      <span
                        className="badge"
                        style={{
                          background:
                            "#dbeafe",

                          color:
                            "#1d4ed8",

                          padding:
                            "7px 12px",

                          borderRadius:
                            "7px",
                        }}
                      >
                        Active Data
                      </span>

                    </td>

                  </tr>


                  {/* DRIVERS */}

                  <tr>

                    <td>

                      <FaUserTie
                        className="me-2"
                        style={{
                          color:
                            "#10b981",
                        }}
                      />

                      Drivers

                    </td>

                    <td
                      className="fw-bold"
                    >
                      {report.drivers}
                    </td>

                    <td>

                      <span
                        className="badge"
                        style={{
                          background:
                            "#d1fae5",

                          color:
                            "#047857",

                          padding:
                            "7px 12px",

                          borderRadius:
                            "7px",
                        }}
                      >
                        Active Data
                      </span>

                    </td>

                  </tr>


                  {/* SHIPMENTS */}

                  <tr>

                    <td>

                      <FaBoxOpen
                        className="me-2"
                        style={{
                          color:
                            "#f97316",
                        }}
                      />

                      Shipments

                    </td>

                    <td
                      className="fw-bold"
                    >
                      {report.shipments}
                    </td>

                    <td>

                      <span
                        className="badge"
                        style={{
                          background:
                            "#ffedd5",

                          color:
                            "#c2410c",

                          padding:
                            "7px 12px",

                          borderRadius:
                            "7px",
                        }}
                      >
                        Active Data
                      </span>

                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

export default Reports;