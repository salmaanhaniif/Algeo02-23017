package main

import (
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"image"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"path/filepath"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"Algeo02-23017/src/backend/utils"
	_ "image/jpeg"
	_ "image/png"

	"github.com/gorilla/mux"
)

func loadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
}

// PostgreSQL connection details from environment variables
var (
	host     = os.Getenv("DB_HOST")
	port     = os.Getenv("DB_PORT")
	user     = os.Getenv("DB_USER")
	password = os.Getenv("DB_PASSWORD")
	dbname   = os.Getenv("DB_NAME")
)

// Function to create the table in PostgreSQL
func createTable(db *sql.DB, tableName string, columns []string) error {
	// Create table query with dynamic columns
	columnDefinitions := make([]string, len(columns))
	for i, col := range columns {
		columnDefinitions[i] = fmt.Sprintf("\"%s\" TEXT", col)
	}
	query := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s (
		id SERIAL PRIMARY KEY,
		%s
	);`, tableName, strings.Join(columnDefinitions, ", "))

	// Execute the query
	_, err := db.Exec(query)
	if err != nil {
		return fmt.Errorf("error creating table: %w", err)
	}
	return nil
}

// Function to insert data into the PostgreSQL table
func insertData(db *sql.DB, tableName string, row []string) error {
	// Prepare query to insert the row into the table
	placeholders := make([]string, len(row))
	for i := range row {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}
	query := fmt.Sprintf(`INSERT INTO %s (%s) VALUES (%s)`,
		tableName,
		strings.Join([]string{"id"}, ", "), // Skip primary column `id`
		strings.Join(placeholders, ", "))

	args := make([]interface{}, len(row))
	for i, v := range row {
		args[i] = v // Assign string to interface{}
	}

	// Execute the insert query
	_, err := db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("error inserting row: %w", err)
	}
	return nil
}

// Function to parse the CSV file and load into PostgreSQL
func loadCSVToPostgres(filePath, tableName, separator string) error {
	// Open the CSV file
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("error opening file: %w", err)
	}
	defer file.Close()

	// Set the CSV separator based on user input
	var r *csv.Reader
	if separator == ";" {
		r = csv.NewReader(file)
		r.Comma = ';'
	} else {
		r = csv.NewReader(file)
	}

	// Read the CSV records
	records, err := r.ReadAll()
	if err != nil {
		return fmt.Errorf("error reading CSV file: %w", err)
	}

	// Get the column names from the first row (header)
	columns := records[0]

	// Connect to PostgreSQL
	connStr := fmt.Sprintf("user=%s password=%s dbname=%s host=%s port=%s sslmode=disable",
		user, password, dbname, host, port)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("error connecting to the database: %w", err)
	}
	defer db.Close()

	// Create the table
	err = createTable(db, tableName, columns)
	if err != nil {
		return err
	}

	// Insert data into PostgreSQL
	for _, record := range records[1:] {
		err = insertData(db, tableName, record)
		if err != nil {
			return err
		}
	}

	return nil
}

// Handler to accept a file upload and process it
func uploadCSVHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	// Parse the form to retrieve the file
	err := r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	// Temporarily store the file
	tmpFile, err := os.CreateTemp("", "uploaded_file_*")
	if err != nil {
		http.Error(w, "Error creating temp file", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tmpFile.Name())

	// Copy the uploaded file into the temp file
	_, err = io.Copy(tmpFile, file)
	if err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}

	// Process the file
	// For this example, assume we want to process a CSV and load it into PostgreSQL
	tableName := "your_table_name" // Example table name
	separator := ","               // Default to comma, could be changed if needed

	err = loadCSVToPostgres(tmpFile.Name(), tableName, separator)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error processing CSV file: %v", err), http.StatusInternalServerError)
		return
	}

	// Return success message
	w.Write([]byte("File uploaded and processed successfully"))
}
func querySearchHandler(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10 << 20)
	file, header, err := r.FormFile("query")
	if err != nil {
		http.Error(w, "Failed to read query file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		http.Error(w, "Invalid file type. Only JPG, JPEG, and PNG are allowed.", http.StatusBadRequest)
		return
	}

	queryPath := filepath.Join(queryDir, "query"+ext)
	dst, err := os.Create(queryPath)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Failed to save query file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	_, err = dst.ReadFrom(file)
	if err != nil {
		http.Error(w, "Failed to write query file", http.StatusInternalServerError)
		return
	}

	imageVectors, filenames, err := utils.LoadImagesFromFolder(uploadDir)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to load images: %v", err), http.StatusInternalServerError)
		return
	}
	avg, standar := utils.Standarisasi(imageVectors)
	kovarian := utils.MatriksKovarian(standar)
	U, err := utils.Svd(kovarian)
	projected := utils.Proyeksi(U, standar, 50)
	queryFile, err := os.Open(queryPath)
	if err != nil {
		http.Error(w, "Failed to open query file", http.StatusInternalServerError)
		return
	}
	defer queryFile.Close()

	queryImage, _, err := image.Decode(queryFile)
	if err != nil {
		http.Error(w, "Failed to decode query image", http.StatusInternalServerError)
		return
	}

	queryGray := utils.ToGrayscale(queryImage)
	queryResized := utils.ResizeImage(queryGray, 64, 64)
	queryVector := utils.FlattenImage(queryResized)
	queryStandar := utils.StandarisasiQuery([][]uint8{queryVector}, avg)
	queryProjected := utils.Proyeksi(U, queryStandar, 50)

	distance := utils.HitungJarakParallel(projected, queryProjected, filenames)
	var results []utils.DistanceIndex
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	for _, dist := range distance {
		if dist.Distance == 0 {
			results = append(results, dist)
		}
	}
	if len(results) > 0 {
		for i := 0; i < len(results); i++ {
			json.NewEncoder(w).Encode(results[i].FileName)
		}
	} else {
		json.NewEncoder(w).Encode(map[string]string{"message": "No matching files found"})
	}
}

const (
	uploadDir = "../frontend/public/uploads"
	queryDir  = "../frontend/public/query"
)

func main() {
	//loadEnv()
	// Set up the HTTP server and routes
	http.HandleFunc("/upload", uploadCSVHandler)
	r := mux.NewRouter()
	r.HandleFunc("/search", querySearchHandler).Methods("POST")

	// Start the server
	fmt.Println("Server started at :8080")
	http.ListenAndServe(":8080", r)
}
