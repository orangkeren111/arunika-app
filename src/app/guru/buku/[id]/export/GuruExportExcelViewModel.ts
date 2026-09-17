"use client";

import { useEffect, useState } from "react";
import { guruRepository } from "@/src/lib/repositories/guruRepository";
import * as XLSX from "xlsx";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

export interface ExportSoalItem {
  id: string;
  babId: string;
  babTitle: string;
  teksSoal: string;
  type: "MCQ" | "ESSAY";
  opsiJawaban: string[] | null;
  jawabanBenarMcq: string | null;
  jawabanBenarEssay: string;
  difficulty: number;
  bloomLevel: string;
  linkGambarSoal: string;
  kompetensi: {
    nomerKompetensi: string;
    isiKompetensi: string;
  } | null;
  isAccepted: boolean;
  isRejected: boolean;
}

export interface ExportBabItem {
  id: string;
  title: string;
  judulBab: string;
  questionCount: number;
}

type SupportedImageType = "png" | "jpg" | "gif";

interface FetchedImage {
  data: ArrayBuffer;
  type: SupportedImageType;
}

export function useExportExcelViewModel(bookId: string) {
  const [buku, setBuku] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [babList, setBabList] = useState<ExportBabItem[]>([]);
  const [soalList, setSoalList] = useState<ExportSoalItem[]>([]);

  const [selectedBabId, setSelectedBabId] =
    useState<string>("ALL");

  const [selectedSoalIds, setSelectedSoalIds] =
    useState<Set<string>>(new Set());

  const [loading, setLoading] = useState<boolean>(true);

  const [exportingWord, setExportingWord] =
    useState<boolean>(false);

  /*
   * ============================================================
   * FETCH DATA
   * ============================================================
   */

  const fetchData = async () => {
    setLoading(true);

    try {
      const data =
        await guruRepository.getBukuExportData(bookId);

      if (data) {
        setBuku(data.buku);
        setBabList(data.babList);

        setSoalList(
          data.soalList as ExportSoalItem[]
        );

        // Default: select every question
        setSelectedSoalIds(
          new Set(
            data.soalList.map((s: any) =>
              s.id.toString()
            )
          )
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch export data:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookId) {
      fetchData();
    }
  }, [bookId]);

  /*
   * ============================================================
   * QUESTION FILTERING / SELECTION
   * ============================================================
   */

  const filteredSoalList =
    selectedBabId === "ALL"
      ? soalList
      : soalList.filter(
        (soal) => soal.babId === selectedBabId
      );

  const stagedSoalList = soalList.filter((soal) =>
    selectedSoalIds.has(soal.id)
  );

  const isAllCurrentBabSelected =
    filteredSoalList.length > 0 &&
    filteredSoalList.every((soal) =>
      selectedSoalIds.has(soal.id)
    );

  const toggleSoalSelection = (soalId: string) => {
    setSelectedSoalIds((previous) => {
      const next = new Set(previous);

      if (next.has(soalId)) {
        next.delete(soalId);
      } else {
        next.add(soalId);
      }

      return next;
    });
  };

  const toggleSelectAllCurrentBab = () => {
    setSelectedSoalIds((previous) => {
      const next = new Set(previous);

      if (isAllCurrentBabSelected) {
        filteredSoalList.forEach((soal) => {
          next.delete(soal.id);
        });
      } else {
        filteredSoalList.forEach((soal) => {
          next.add(soal.id);
        });
      }

      return next;
    });
  };

  const selectAllInBook = () => {
    setSelectedSoalIds(
      new Set(soalList.map((soal) => soal.id))
    );
  };

  const clearAllSelections = () => {
    setSelectedSoalIds(new Set());
  };

  /*
   * ============================================================
   * EXCEL EXPORT
   * ============================================================
   */

  const handleExportExcel = () => {
    if (stagedSoalList.length === 0) {
      alert(
        "Tidak ada soal yang dipilih untuk diekspor."
      );
      return;
    }

    const rows = stagedSoalList.map((soal, index) => {
      let optA = "";
      let optB = "";
      let optC = "";
      let optD = "";
      let optE = "";

      if (Array.isArray(soal.opsiJawaban)) {
        optA = soal.opsiJawaban[0] || "";
        optB = soal.opsiJawaban[1] || "";
        optC = soal.opsiJawaban[2] || "";
        optD = soal.opsiJawaban[3] || "";
        optE = soal.opsiJawaban[4] || "";
      }

      const kunci =
        soal.type === "MCQ"
          ? soal.jawabanBenarMcq || ""
          : soal.jawabanBenarEssay || "";

      const komp = soal.kompetensi
        ? `${soal.kompetensi.nomerKompetensi} - ${soal.kompetensi.isiKompetensi}`
        : "";

      return {
        No: index + 1,
        Bab: soal.babTitle,
        "Tipe Soal":
          soal.type === "MCQ"
            ? "Pilihan Ganda"
            : "Essay",
        "Teks Soal": soal.teksSoal,
        "Opsi A": optA,
        "Opsi B": optB,
        "Opsi C": optC,
        "Opsi D": optD,
        "Opsi E": optE,
        "Kunci Jawaban": kunci,
        "Tingkat Kesulitan": soal.difficulty || 1,
        "Tingkat Bloom":
          soal.bloomLevel || "C1",
        Kompetensi: komp,
        "Link Gambar":
          soal.linkGambarSoal || "",
      };
    });

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 22 },
      { wch: 15 },
      { wch: 50 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 18 },
      { wch: 15 },
      { wch: 35 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Bank Soal"
    );

    const sanitizedTitle = (
      buku?.title || "Buku"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");

    const fileName =
      `Bank_Soal_${sanitizedTitle}_${Date.now()}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  /*
   * ============================================================
   * WORD IMAGE FETCHING
   * ============================================================
   */

  const fetchImage = async (
    imageUrl: string
  ): Promise<FetchedImage | null> => {
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(
          `Image request failed: ${response.status}`
        );
      }

      const contentType =
        response.headers
          .get("content-type")
          ?.toLowerCase() || "";

      let type: SupportedImageType = "png";

      if (
        contentType.includes("jpeg") ||
        contentType.includes("jpg")
      ) {
        type = "jpg";
      } else if (
        contentType.includes("gif")
      ) {
        type = "gif";
      } else if (
        contentType.includes("png")
      ) {
        type = "png";
      } else {
        /*
         * If the server doesn't provide a useful
         * content-type, try to determine it from
         * the URL.
         */
        const cleanUrl = imageUrl
          .split("?")[0]
          .toLowerCase();

        if (
          cleanUrl.endsWith(".jpg") ||
          cleanUrl.endsWith(".jpeg")
        ) {
          type = "jpg";
        } else if (
          cleanUrl.endsWith(".gif")
        ) {
          type = "gif";
        } else {
          type = "png";
        }
      }

      return {
        data: await response.arrayBuffer(),
        type,
      };
    } catch (error) {
      console.error(
        "Failed to fetch question image:",
        imageUrl,
        error
      );

      return null;
    }
  };

  /*
   * ============================================================
   * WORD HELPERS
   * ============================================================
   */

  const createCell = (
    children: Paragraph[],
    options?: {
      columnSpan?: number;
      rowSpan?: number;
      verticalAlign?: "center" | "top" | "bottom";
    }
  ) => {
    let verticalAlignment: "center" | "top" | "bottom" =
      VerticalAlign.CENTER;

    if (
      options?.verticalAlign === "top"
    ) {
      verticalAlignment = VerticalAlign.TOP;
    }

    if (
      options?.verticalAlign === "bottom"
    ) {
      verticalAlignment = VerticalAlign.BOTTOM;
    }

    return new TableCell({
      children,

      columnSpan: options?.columnSpan,
      rowSpan: options?.rowSpan,

      verticalAlign: verticalAlignment,

      margins: {
        top: 100,
        bottom: 100,
        left: 120,
        right: 120,
      },

      borders: {
        top: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
        bottom: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
        left: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
        right: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },
    });
  };

  const createLabelParagraph = (
    label: string,
    value: string
  ) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: `${label}\n`,
          bold: true,
          size: 22,
        }),

        new TextRun({
          text: value,
          size: 22,
        }),
      ],

      spacing: {
        after: 100,
      },
    });
  };

  /*
   * ============================================================
   * CREATE ONE QUESTION TABLE
   * ============================================================
   *
   * 4 columns:
   *
   * Row 1:
   * ┌───────────┬──────────────┬──────────────┬───────────────┐
   * │ Nomor     │ Kompetensi                  │ Bloom          │
   * │ Soal      │ (colspan 2)                │ Taxonomy       │
   * └───────────┴──────────────┴──────────────┴───────────────┘
   *
   * Row 2:
   * ┌───────────┬──────────────┬──────────────┬───────────────┐
   * │ Gambar    │ Soal (colspan 2)             │               │
   * └───────────┴──────────────┴──────────────┴───────────────┘
   *
   * Row 3:
   * ┌──────────────────────────────────────────────────────────┐
   * │ Opsi Jawaban (colspan 4)                                 │
   * └──────────────────────────────────────────────────────────┘
   *
   * Row 4:
   * ┌──────────────────────────────────────────────────────────┐
   * │ Jawaban Benar (colspan 4)                                │
   * └──────────────────────────────────────────────────────────┘
   *
   * ============================================================
   */

  const createQuestionTable = async (
    soal: ExportSoalItem,
    nomorSoal: number
  ): Promise<Table> => {
    /*
     * ----------------------------------------------------------
     * ROW 1
     * ----------------------------------------------------------
     */

    const nomorCell = createCell(
      [
        createLabelParagraph(
          "Nomor Soal",
          nomorSoal.toString()
        ),
      ],
      {
        verticalAlign: "center",
      }
    );

    const kompetensiText = soal.kompetensi
      ? `${soal.kompetensi.nomerKompetensi} - ${soal.kompetensi.isiKompetensi}`
      : "-";

    const kompetensiCell = createCell(
      [
        createLabelParagraph(
          "Kompetensi",
          kompetensiText
        ),
      ],
      {
        columnSpan: 2,
        verticalAlign: "center",
      }
    );

    const bloomCell = createCell(
      [
        createLabelParagraph(
          "Bloom's Taxonomy",
          soal.bloomLevel || "-"
        ),
      ],
      {
        verticalAlign: "center",
      }
    );

    /*
     * ----------------------------------------------------------
     * ROW 2 - IMAGE
     * ----------------------------------------------------------
     */

    const imageParagraphs: Paragraph[] = [];

    if (soal.linkGambarSoal) {
      const image = await fetchImage(
        soal.linkGambarSoal
      );

      if (image) {
        imageParagraphs.push(
          new Paragraph({
            alignment:
              AlignmentType.CENTER,

            children: [
              new ImageRun({
                type: image.type,

                data: image.data,

                transformation: {
                  width: 220,
                  height: 150,
                },
              }),
            ],

            spacing: {
              after: 100,
            },
          })
        );
      }
    }

    if (imageParagraphs.length === 0) {
      imageParagraphs.push(
        new Paragraph({
          alignment:
            AlignmentType.CENTER,

          children: [
            new TextRun({
              text: "Tidak ada gambar",
              italics: true,
              size: 18,
            }),
          ],
        })
      );
    }

    const imageCell = createCell(
      imageParagraphs,
      {
        verticalAlign: "center",
      }
    );

    /*
     * ----------------------------------------------------------
     * ROW 2 - QUESTION
     * ----------------------------------------------------------
     */

    const questionCell = createCell(
      [
        new Paragraph({
          children: [
            new TextRun({
              text: soal.teksSoal || "-",
              size: 22,
            }),
          ],

          spacing: {
            after: 100,
          },
        }),
      ],
      {
        columnSpan: 2,
        verticalAlign: "top",
      }
    );

    /*
     * ----------------------------------------------------------
     * ROW 3 - OPTIONS
     * ----------------------------------------------------------
     */

    const optionParagraphs: Paragraph[] = [];

    optionParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Opsi Jawaban",
            bold: true,
            size: 22,
          }),
        ],

        spacing: {
          after: 150,
        },
      })
    );

    if (soal.type === "MCQ") {
      if (
        Array.isArray(soal.opsiJawaban) &&
        soal.opsiJawaban.length > 0
      ) {
        soal.opsiJawaban.forEach(
          (option, index) => {
            optionParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${String.fromCharCode(
                      65 + index
                    )}. `,
                    bold: true,
                    size: 22,
                  }),

                  new TextRun({
                    text: option || "",
                    size: 22,
                  }),
                ],

                spacing: {
                  after: 100,
                },
              })
            );
          }
        );
      } else {
        optionParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "-",
                size: 22,
              }),
            ],
          })
        );
      }
    } else {
      optionParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Essay",
              size: 22,
            }),
          ],
        })
      );
    }

    const optionsCell = createCell(
      optionParagraphs,
      {
        columnSpan: 4,
        verticalAlign: "top",
      }
    );

    /*
     * ----------------------------------------------------------
     * ROW 4 - CORRECT ANSWER
     * ----------------------------------------------------------
     */

    const correctAnswer =
      soal.type === "MCQ"
        ? soal.jawabanBenarMcq || "-"
        : soal.jawabanBenarEssay || "-";

    const correctAnswerCell = createCell(
      [
        new Paragraph({
          children: [
            new TextRun({
              text: "Jawaban Benar\n",
              bold: true,
              size: 22,
            }),

            new TextRun({
              text: correctAnswer,
              size: 22,
            }),
          ],
        }),
      ],
      {
        columnSpan: 4,
        verticalAlign: "top",
      }
    );

    /*
     * ----------------------------------------------------------
     * TABLE
     * ----------------------------------------------------------
     */

    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },

      borders: {
        top: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
        bottom: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
        left: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
        right: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
        insideVertical: {
          style: BorderStyle.SINGLE,
          size: 1,
        },
      },

      rows: [
        /*
         * Row 1
         */
        new TableRow({
          children: [
            nomorCell,
            kompetensiCell,
            bloomCell,
          ],
        }),

        /*
         * Row 2
         */
        new TableRow({
          children: [
            imageCell,
            questionCell,
          ],
        }),

        /*
         * Row 3
         */
        new TableRow({
          children: [
            optionsCell,
          ],
        }),

        /*
         * Row 4
         */
        new TableRow({
          children: [
            correctAnswerCell,
          ],
        }),
      ],
    });
  };

  /*
   * ============================================================
   * WORD EXPORT
   * ============================================================
   */

  const handleExportWord = async () => {
    if (stagedSoalList.length === 0) {
      alert(
        "Tidak ada soal yang dipilih untuk diekspor."
      );
      return;
    }

    if (exportingWord) {
      return;
    }

    setExportingWord(true);

    try {
      const children: (
        | Paragraph
        | Table
      )[] = [];

      /*
       * Document title
       */
      children.push(
        new Paragraph({
          alignment:
            AlignmentType.CENTER,

          children: [
            new TextRun({
              text: `Bank Soal - ${buku?.title || "Buku"
                }`,
              bold: true,
              size: 28,
            }),
          ],

          spacing: {
            after: 300,
          },
        })
      );

      /*
       * Generate each question table.
       */
      for (
        let index = 0;
        index < stagedSoalList.length;
        index++
      ) {
        const soal =
          stagedSoalList[index];

        const table =
          await createQuestionTable(
            soal,
            index + 1
          );

        children.push(table);

        /*
         * Space between question tables.
         */
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "",
              }),
            ],

            spacing: {
              after: 300,
            },
          })
        );
      }

      /*
       * IMPORTANT:
       *
       * Don't call this variable "document",
       * because that conflicts with window.document.
       */
      const wordDocument =
        new Document({
          sections: [
            {
              properties: {},
              children,
            },
          ],
        });

      const blob =
        await Packer.toBlob(
          wordDocument
        );

      const sanitizedTitle = (
        buku?.title || "Buku"
      ).replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );

      const fileName =
        `Bank_Soal_${sanitizedTitle}_${Date.now()}.docx`;

      /*
       * Browser download
       */
      const url =
        window.URL.createObjectURL(blob);

      const anchor =
        window.document.createElement(
          "a"
        );

      anchor.href = url;
      anchor.download = fileName;

      window.document.body.appendChild(
        anchor
      );

      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Failed to generate Word document:",
        error
      );

      alert(
        "Gagal membuat dokumen Word. Silakan coba lagi."
      );
    } finally {
      setExportingWord(false);
    }
  };

  /*
   * ============================================================
   * RETURN
   * ============================================================
   */

  return {
    buku,
    babList,
    soalList,

    filteredSoalList,
    stagedSoalList,

    selectedBabId,
    setSelectedBabId,

    selectedSoalIds,

    isAllCurrentBabSelected,

    loading,
    exportingWord,

    toggleSoalSelection,
    toggleSelectAllCurrentBab,

    selectAllInBook,
    clearAllSelections,

    handleExportExcel,
    handleExportWord,
  };
}