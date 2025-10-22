# Kit API Demo

Teste die verschiedenen Kit API Funktionen in den Code-Blöcken unten.

## Dialog Funktionen

### Prompt Dialog

```js
const name = await kit.prompt("Wie heißt du?", "Max Mustermann");
if (name) {
  console.log(`Hallo, ${name}!`);
} else {
  console.log("Eingabe abgebrochen");
}
```

### Alert Dialog

```js
await kit.alert("Das ist eine wichtige Nachricht!");
console.log("Alert wurde geschlossen");
```

### Confirm Dialog

```js
const confirmed = await kit.confirm("Möchtest du fortfahren?");
console.log(confirmed ? "Bestätigt!" : "Abgebrochen");
```

## Upload-Funktionen

### Tabellen-Upload (CSV/Excel)

```js
try {
  const file = await kit.upload.table();
  console.log(`Datei: ${file.name}`);
  console.log(`Sheets: ${file.sheets.length}`);
  
  // Erstes Sheet anzeigen
  const sheet = file.sheets[0];
  console.log(`Sheet: ${sheet.name}`);
  console.log(`Zeilen: ${sheet.data.length}`);
  console.log("Spalten:", sheet.columns);
  
  // Erste 5 Zeilen anzeigen
  console.table(sheet.data.slice(0, 5));
  
  // Bei Excel: Alle Sheets anzeigen
  if (file.sheets.length > 1) {
    console.log("\nAlle Sheets:");
    file.sheets.forEach(s => {
      console.log(`- ${s.name}: ${s.data.length} Zeilen`);
    });
  }
} catch (error) {
  console.log("Upload abgebrochen");
}
```

### JSON Upload

```js
try {
  const data = await kit.upload.json();
  console.log("JSON Daten:", data);
} catch (error) {
  console.log("Fehler:", error.message);
}
```

### Text Upload

```js
try {
  const text = await kit.upload.text();
  console.log("Text Länge:", text.length);
  console.log("Erste 200 Zeichen:", text.substring(0, 200));
} catch (error) {
  console.log("Upload abgebrochen");
}
```

### Generischer File Upload

```js
try {
  const file = await kit.upload.file(".pdf,.doc,.docx");
  console.log(`Datei: ${file.name}`);
  console.log(`Größe: ${file.size} bytes`);
  console.log(`Typ: ${file.type}`);
} catch (error) {
  console.log("Upload abgebrochen");
}
```

## Download-Funktionen

### Text Download

```js
kit.download("Hallo Welt!", "test.txt");
```

### JSON Download

```js
const data = { 
  name: "Test", 
  value: 42,
  items: ["a", "b", "c"]
};
kit.download(data, "data.json");
```

### CSV Download

```js
const tableData = [
  { name: "Alice", age: 30, city: "Berlin" },
  { name: "Bob", age: 25, city: "Hamburg" },
  { name: "Charlie", age: 35, city: "München" }
];
kit.download(tableData, "users.csv");
```

## Utility Funktionen

### Sleep/Delay

```js
console.log("Start...");
await kit.sleep(1000);
console.log("Nach 1 Sekunde");
await kit.sleep(2000);
console.log("Nach weiteren 2 Sekunden");
```

### Fetch API

```js
try {
  const response = await kit.fetch('https://api.github.com/repos/microsoft/vscode');
  const data = await response.json();
  console.log(`VSCode hat ${data.stargazers_count} Sterne auf GitHub!`);
} catch (error) {
  console.error("Fehler beim Abrufen:", error);
}
```

## Kombinierte Beispiele

### Excel Sheet Analyse

```js
try {
  const file = await kit.upload.table();
  
  for (const sheet of file.sheets) {
    console.log(`\nAnalyse von Sheet: ${sheet.name}`);
    console.log(`Zeilen: ${sheet.data.length}`);
    
    // Spaltentypen anzeigen
    sheet.columns.forEach(col => {
      console.log(`- ${col.name}: ${col.type}`);
    });
    
    // Numerische Spalten finden
    const numericCols = sheet.columns
      .filter(c => c.type === "number")
      .map(c => c.name);
    
    if (numericCols.length > 0 && sheet.data.length > 0) {
      // Summen berechnen
      const sums = {};
      numericCols.forEach(col => {
        sums[col] = sheet.data.reduce((sum, row) => sum + (row[col] || 0), 0);
      });
      console.log("Summen:", sums);
    }
  }
} catch (error) {
  console.log("Abgebrochen");
}
```

### Mehrere Downloads (automatisches ZIP)

```js
// Mehrere Dateien downloaden - automatisch als ZIP
kit.download("Bericht für Januar 2024", "report-jan.txt");
kit.download({ sales: 15000, customers: 234 }, "stats-jan.json");
kit.download([
  { product: "Laptop", sold: 45 },
  { product: "Mouse", sold: 123 }
], "sales-jan.csv");

// Am Ende des Scripts werden alle 3 Dateien automatisch 
// als "kit-download-2024-01-15.zip" heruntergeladen
```

### Interaktive Datenkonvertierung

```js
// CSV zu JSON konvertieren
try {
  const file = await kit.upload.table();
  const sheet = file.sheets[0];
  
  console.log(`${sheet.data.length} Zeilen geladen`);
  console.table(sheet.data.slice(0, 3));
  
  if (await kit.confirm("Als JSON speichern?")) {
    const filename = file.name.replace(/\.(csv|xlsx?)$/i, ".json");
    kit.download(sheet.data, filename);
    await kit.alert("Datei wurde konvertiert!");
  }
} catch (error) {
  console.log("Vorgang abgebrochen");
}
```

### Batch-Verarbeitung

```js
const results = [];

while (await kit.confirm("Weitere Datei hochladen?")) {
  try {
    const file = await kit.upload.table();
    const sheet = file.sheets[0];
    
    results.push({
      file: file.name,
      rows: sheet.data.length,
      columns: sheet.columns.length
    });
    
    console.log(`${file.name}: ${sheet.data.length} Zeilen verarbeitet`);
  } catch (error) {
    console.log("Übersprungen");
  }
}

if (results.length > 0) {
  console.table(results);
  kit.download(results, "batch-results.json");
}
```

## Downloads - Automatisches Batching

Alle `kit.download()` Aufrufe werden automatisch gesammelt:
- **1 Datei**: Wird normal heruntergeladen
- **Mehrere Dateien**: Werden automatisch als ZIP verpackt
### Beispiel: Mehrere Reports exportieren

```js
// Verschiedene Formate exportieren
const monthlyData = await kit.db.query("SELECT * FROM sales WHERE month = 1");

kit.download(monthlyData, "january-sales.json");
kit.download(monthlyData, "january-sales.csv");
kit.download(`Total sales: ${monthlyData.length} items`, "january-summary.txt");

// Wird automatisch als ZIP heruntergeladen!
```

### Beispiel: Datenbank-Export

```js
// Alle Tabellen exportieren
const tables = await kit.db.tables();

for (const table of tables) {
  const data = await kit.db.query(`SELECT * FROM "${table}"`);
  const schema = await kit.db.schema(table);
  
  // Daten und Schema downloaden
  kit.download(data, `${table}.csv`);
  kit.download(schema, `${table}-schema.json`);
}

// Datenbank selbst
const dbBlob = kit.db.export();
kit.download(dbBlob, "database.db");

// Alles wird automatisch als ZIP verpackt
```

### Explizite Kontrolle

```js
// Downloads manuell auslösen (normalerweise automatisch)
kit.download("Datei 1", "file1.txt");
kit.download("Datei 2", "file2.txt");

// Manuell finalisieren falls nötig
await kit.finalize();

// Weitere Downloads starten neue Batch
kit.download("Datei 3", "file3.txt"); // Wird einzeln heruntergeladen
```

## Datenbank API

### Datenbank verwenden

```js
// Standard-DB wird automatisch erstellt/geladen
await kit.db.query("SELECT 1"); // Erstellt "default" DB wenn nötig

// Andere Datenbank verwenden
await kit.db.use("meine-daten");

// In-Memory Datenbank
await kit.db.use("temp", true);

// Datenbank aus Datei laden
const blob = await kit.upload.file(".db");
await kit.db.use("imported", blob.content);

console.log(`Aktuelle DB: ${kit.db.current}`);
```

### Tabelle erstellen und Daten einfügen

```js
// Tabelle erstellen (nutzt automatisch "default" DB)
await kit.db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    age INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Daten einfügen
await kit.db.query(
  "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
  ["Max Mustermann", "max@example.com", 28]
);

console.log("Daten eingefügt!");
```

### Daten abfragen

```js
// Alle Benutzer abrufen
const users = await kit.db.query("SELECT * FROM users");
console.table(users);

// Mit Parametern
const youngUsers = await kit.db.query(
  "SELECT name, age FROM users WHERE age < ?",
  [30]
);
console.table(youngUsers);
```

### CSV/Excel in Datenbank importieren

```js
// CSV/Excel hochladen
const file = await kit.upload.table();

// Ganze Datei importieren (nutzt erstes Sheet)
await kit.db.import("verkaufsdaten", file);

// Oder spezifisches Sheet
await kit.db.import("verkaufsdaten_2", file.sheets[1]);

// Analyse durchführen
const summary = await kit.db.query(`
  SELECT 
    COUNT(*) as anzahl,
    SUM(betrag) as gesamt,
    AVG(betrag) as durchschnitt
  FROM verkaufsdaten
`);

console.table(summary);
```

### Datenbank-Verwaltung

```js
// Alle gespeicherten Datenbanken anzeigen
const databases = kit.db.list();
console.log("Verfügbare Datenbanken:", databases);

// Tabellen anzeigen
const tables = await kit.db.tables();
console.log("Tabellen:", tables);

// Schema einer Tabelle
const schema = await kit.db.schema("users");
console.log("Schema:", schema);

// Datenbank exportieren
const blob = kit.db.export();
kit.download(blob, `${kit.db.current}-backup.db`);

// Datenbank wechseln
await kit.db.use("andere-db");

// Datenbank löschen
kit.db.delete("alte-daten");
```

### Mit SQL-Blöcken arbeiten

Datenbank vorbereiten (optional - "default" wird automatisch verwendet):

```js
// Testdaten erstellen
await kit.db.query(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY,
    name TEXT,
    department TEXT,
    salary REAL
  )
`);

await kit.db.query(`
  INSERT INTO employees (name, department, salary) VALUES
  ('Alice', 'IT', 75000),
  ('Bob', 'HR', 65000),
  ('Charlie', 'IT', 80000)
`);

console.log("Datenbank bereit für SQL-Abfragen!");
```

Dann SQL direkt ausführen:

```sql
-- Abteilungsstatistiken
SELECT 
  department,
  COUNT(*) as mitarbeiter,
  AVG(salary) as durchschnittsgehalt,
  SUM(salary) as gesamtgehalt
FROM employees
GROUP BY department
ORDER BY durchschnittsgehalt DESC;
```

```sql
-- Top-Verdiener
SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC;
```
