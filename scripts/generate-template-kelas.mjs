/**
 * Script to generate TemplateImportAnggotaKelas.xlsx
 * Run: node scripts/generate-template-kelas.mjs
 */
import * as XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "../public/template/TemplateImportAnggotaKelas.xlsx");

// Build the workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Template
const templateData = [
  { username: "siswa01" },
  { username: "siswa02@sekolah.sch.id" },
];

const ws = XLSX.utils.json_to_sheet(templateData, { header: ["username"] });

// Column width
ws["!cols"] = [{ wch: 40 }];

XLSX.utils.book_append_sheet(wb, ws, "Import Anggota Kelas");

// Sheet 2: Petunjuk
const instructionData = [
  { Petunjuk: "Panduan Pengisian" },
  { Petunjuk: "" },
  { Petunjuk: "1. Isi kolom 'username' dengan username atau email siswa yang sudah terdaftar." },
  { Petunjuk: "2. Nama kolom bisa 'username', 'Username', 'USERNAME', 'email', 'Email', atau 'EMAIL'." },
  { Petunjuk: "3. Satu baris = satu siswa." },
  { Petunjuk: "4. Siswa yang sudah menjadi anggota kelas akan dilewati (tidak error)." },
  { Petunjuk: "5. Pastikan siswa sudah terdaftar dan memiliki role SISWA di sekolah Anda." },
];

const wsInfo = XLSX.utils.json_to_sheet(instructionData, { header: ["Petunjuk"] });
wsInfo["!cols"] = [{ wch: 80 }];

XLSX.utils.book_append_sheet(wb, wsInfo, "Petunjuk");

XLSX.writeFile(wb, outputPath);
console.log("Template generated:", outputPath);
