package utils

import (
	"archive/zip"
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
	"sort"
	"sync"

	"gonum.org/v1/gonum/mat"
)

func ToGrayscale(img image.Image) *image.Gray {
	ukuran := img.Bounds()
	grayImage := image.NewGray(ukuran)

	for y := ukuran.Min.Y; y < ukuran.Max.Y; y++ {
		for x := ukuran.Min.X; x < ukuran.Max.X; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			value := uint8(0.2989*float64(r>>8) + 0.5870*float64(g>>8) + 0.1140*float64(b>>8))
			grayImage.SetGray(x, y, color.Gray{Y: value})
		}
	}
	return grayImage
}

func ResizeImage(img *image.Gray, newWidth, newHeight int) *image.Gray {
	ukuranAwal := img.Bounds()
	lebarAwal := ukuranAwal.Dx()
	tinggiAwal := ukuranAwal.Dy()

	newImage := image.NewGray(image.Rect(0, 0, newWidth, newHeight))

	for y := 0; y < newHeight; y++ {
		for x := 0; x < newWidth; x++ {
			// Menghitung koordinat piksel asal (nearest neighbor)
			srcX := x * lebarAwal / newWidth
			srcY := y * tinggiAwal / newHeight
			gray := img.GrayAt(srcX, srcY)
			newImage.SetGray(x, y, gray)
		}
	}
	return newImage
}

func FlattenImage(img *image.Gray) []uint8 {
	ukuran := img.Bounds()
	vektor := make([]uint8, ukuran.Dx()*ukuran.Dy())
	index := 0
	for y := ukuran.Min.Y; y < ukuran.Max.Y; y++ {
		for x := ukuran.Min.X; x < ukuran.Max.X; x++ {
			vektor[index] = img.GrayAt(x, y).Y
			index++
		}
	}
	return vektor
}
func SaveImage(filename string, img image.Image) error {
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer file.Close()
	err = jpeg.Encode(file, img, nil)
	if err != nil {
		return fmt.Errorf("failed to encode image: %v", err)
	}

	return nil
}
func Standarisasi(vectors [][]uint8) ([]float64, [][]float64) {
	countImg := len(vectors)
	countPixel := len(vectors[0])
	avg := make([]float64, countPixel)
	terstandarisasi := make([][]float64, countImg)

	for i := range vectors {
		terstandarisasi[i] = make([]float64, countPixel)
		for j := 0; j < countPixel; j++ {
			avg[j] += float64(vectors[i][j])
		}
	}

	for j := range avg {
		avg[j] /= float64(countImg)
	}

	for i := range vectors {
		for j := 0; j < countPixel; j++ {
			terstandarisasi[i][j] = float64(vectors[i][j]) - avg[j]
		}
	}
	return avg, terstandarisasi
}
func StandarisasiQuery(vectors [][]uint8, avg []float64) [][]float64 {
	countImg := len(vectors)
	countPixel := len(vectors[0])
	terstandarisasi := make([][]float64, countImg)
	for i := 0; i < countImg; i++ {
		terstandarisasi[i] = make([]float64, countPixel)
		for j := 0; j < countPixel; j++ {
			terstandarisasi[i][j] = float64(vectors[i][j]) - avg[j]
		}
	}
	return terstandarisasi
}
func MatriksKovarian(vectors [][]float64) *mat.Dense {
	baris := len(vectors)
	kolom := len(vectors[0])
	data := make([]float64, baris*kolom)
	for i := 0; i < baris; i++ {
		for j := 0; j < kolom; j++ {
			data[i*kolom+j] = vectors[i][j]
		}
	}
	matriks := mat.NewDense(baris, kolom, data)
	matriksTranspose := matriks.T()
	var kaliMatriks mat.Dense
	kaliMatriks.Mul(matriksTranspose, matriks)
	var matriksKovarian mat.Dense
	matriksKovarian.Scale(1/float64(baris), &kaliMatriks)
	return &matriksKovarian
}
func Svd(matriksKovarian *mat.Dense) (*mat.Dense, error) {
	k := 50
	m := matriksKovarian.RawMatrix().Rows
	kovarianTruncated := mat.NewDense(m, k, nil)

	for i := 0; i < m; i++ {
		for j := 0; j < k; j++ {
			kovarianTruncated.Set(i, j, matriksKovarian.At(i, j))
		}
	}
	var svd mat.SVD
	hasil := svd.Factorize(kovarianTruncated, mat.SVDThin)
	if !hasil {
		return nil, fmt.Errorf("gagal dekomposisi SVD")
	}
	var U mat.Dense
	svd.UTo(&U)
	return &U, nil
}
func Proyeksi(U *mat.Dense, q [][]float64, k int) *mat.Dense {
	Uk := U.Slice(0, U.RawMatrix().Rows, 0, k).(*mat.Dense)
	countImg := len(q)
	data := make([]float64, countImg*len(q[0]))
	for i := range q {
		copy(data[i*len(q[0]):(i+1)*len(q[0])], q[i])
	}
	qbaru := mat.NewDense(countImg, len(q[0]), data)
	hasil := mat.NewDense(countImg, k, nil)
	hasil.Mul(qbaru, Uk)
	return hasil
}
func JarakEuclidean(v1, v2 *mat.Dense) float64 {
	diff := make([]float64, v1.RawMatrix().Rows*v1.RawMatrix().Cols)
	for i := 0; i < len(diff); i++ {
		diff[i] = v1.RawMatrix().Data[i] - v2.RawMatrix().Data[i]
	}
	return mat.Norm(mat.NewVecDense(len(diff), diff), 2)
}
func LoadImagesFromZip(zipPath string) ([][]uint8, []string, error) {
	var vectors [][]uint8
	var filenames []string
	var mu sync.Mutex
	var wg sync.WaitGroup

	reader, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to open ZIP file: %v", err)
	}
	defer reader.Close()

	for _, file := range reader.File {
		if file.FileInfo().IsDir() {
			continue
		}

		ext := filepath.Ext(file.Name)
		if ext != ".jpg" && ext != ".png" {
			continue
		}

		wg.Add(1)

		go func(file *zip.File) {
			defer wg.Done()
			zippedFile, err := file.Open()
			if err != nil {
				fmt.Printf("failed to open file %s: %v\n", file.Name, err)
				return
			}
			defer zippedFile.Close()
			buf := new(bytes.Buffer)
			_, err = buf.ReadFrom(zippedFile)
			if err != nil {
				fmt.Printf("failed to read file %s: %v\n", file.Name, err)
				return
			}
			img, _, err := image.Decode(buf)
			if err != nil {
				fmt.Printf("failed to decode image %s: %v\n", file.Name, err)
				return
			}
			grayImg := ToGrayscale(img)
			resizedImg := ResizeImage(grayImg, 64, 64)
			vector := FlattenImage(resizedImg)
			mu.Lock()
			vectors = append(vectors, vector)
			filenames = append(filenames, file.Name)
			mu.Unlock()
		}(file)
	}
	wg.Wait()

	return vectors, filenames, nil
}
func LoadImagesFromFolder(folderPath string) ([][]uint8, []string, error) {
	var vectors [][]uint8
	var filenames []string
	var mu sync.Mutex
	var wg sync.WaitGroup

	err := filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		ext := filepath.Ext(path)
		if ext != ".jpg" && ext != ".png" && ext != ".jpeg" {
			return nil
		}

		wg.Add(1)

		go func(path string) {
			defer wg.Done()

			file, err := os.Open(path)
			if err != nil {
				fmt.Printf("failed to open file %s: %v\n", path, err)
				return
			}
			defer file.Close()
			img, _, err := image.Decode(file)
			if err != nil {
				fmt.Printf("failed to decode image %s: %v\n", path, err)
				return
			}
			grayImg := ToGrayscale(img)
			resizedImg := ResizeImage(grayImg, 64, 64)
			vector := FlattenImage(resizedImg)
			fmt.Printf("Berhasil memproses gambar %s\n", path)
			mu.Lock()
			vectors = append(vectors, vector)
			filenames = append(filenames, path)
			mu.Unlock()
		}(path)

		return nil
	})

	if err != nil {
		return nil, nil, fmt.Errorf("failed to walk folder: %v", err)
	}

	wg.Wait()

	return vectors, filenames, nil
}

type DistanceIndex struct {
	Distance   float64
	Similarity float64
	FileName   string
}

func HitungJarakParallel(projected *mat.Dense, projectedquery *mat.Dense, filenames []string) []DistanceIndex {
	var distances []DistanceIndex
	results := make(chan DistanceIndex, projected.RawMatrix().Rows)
	wg := sync.WaitGroup{}

	maxDist := 0.0

	for i := 0; i < projected.RawMatrix().Rows; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			row := mat.NewDense(1, projected.RawMatrix().Cols, projected.RawRowView(i))
			dist := JarakEuclidean(projectedquery, row)

			results <- DistanceIndex{Distance: dist, FileName: filenames[i]}
		}(i)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	for result := range results {
		if result.Distance > maxDist {
			maxDist = result.Distance
		}
		distances = append(distances, result)
	}
	for i := range distances {
		distances[i].Similarity = (1 - (distances[i].Distance / maxDist)) * 100
	}

	sort.Slice(distances, func(i, j int) bool {
		return distances[i].Similarity > distances[j].Similarity
	})
	return distances
}

// func main() {
// 	// ternyata saat dicompress proyeksinya berbeda
// 	start := time.Now()
// 	vectors, filename, err := loadImagesFromFolder("MusicImage")
// 	avg, standar := standarisasi(vectors)
// 	kovarian := matriksKovarian(standar)
// 	U, err := svd(kovarian)
// 	projected := proyeksi(U, standar, 50)
// 	// var vectors [][]uint8
// 	// var filename []string
// 	// file1, err := os.Open("parentpng.png")
// 	// if err != nil {
// 	// 	fmt.Println("Error membuka file:", err)
// 	// 	return
// 	// }
// 	// defer file1.Close()
// 	// img1, _, err := image.Decode(file1)
// 	// if err != nil {
// 	// 	fmt.Println("Error decoding gambar:", err)
// 	// 	return
// 	// }
// 	// grayImg1 := toGrayscale(img1)
// 	// resizedImg1 := resizeImage(toGrayscale(grayImg1), 64, 64)
// 	// vector1 := flattenImage(resizedImg1)
// 	// vectors = append(vectors, vector1)
// 	// filename = append(filename, "parentpng.png")
// 	// file2, err := os.Open("childpng.png")
// 	// if err != nil {
// 	// 	fmt.Println("Error membuka file:", err)
// 	// 	return
// 	// }
// 	// defer file2.Close()
// 	// img2, _, err := image.Decode(file2)
// 	// if err != nil {
// 	// 	fmt.Println("Error decoding gambar:", err)
// 	// 	return
// 	// }
// 	// grayImg2 := toGrayscale(img2)
// 	// resizedImg2 := resizeImage(toGrayscale(grayImg2), 64, 64)
// 	// vector2 := flattenImage(resizedImg2)
// 	// vectors = append(vectors, vector2)
// 	// filename = append(filename, "childpng.png")
// 	// avg, standar := standarisasi(vectors)
// 	// matriksKovarian := matriksKovarian(standar)
// 	// U, err := svd(matriksKovarian)
// 	// projected := proyeksi(U, standar, 50)
// 	file, err := os.Open("childjpeg.jpeg")
// 	if err != nil {
// 		fmt.Println("Error membuka file:", err)
// 		return
// 	}
// 	defer file.Close()
// 	img, _, err := image.Decode(file)
// 	if err != nil {
// 		fmt.Println("Error decoding gambar:", err)
// 		return
// 	}
// 	grayImg := toGrayscale(img)
// 	resizedImg := resizeImage(toGrayscale(grayImg), 64, 64)
// 	vectorquery := flattenImage(resizedImg)
// 	standarquery := standarisasiQuery([][]uint8{vectorquery}, avg)
// 	projectedquery := proyeksi(U, standarquery, 50)

// 	distances := hitungJarakParallel(projected, projectedquery, filename)
// 	for i, di := range distances {
// 		if i >= 5 {
// 			break
// 		}
// 		fmt.Printf("Gambar: %s, Jarak: %f, Kemiripan: %.2f%%\n", di.FileName, di.Distance, di.Similarity)
// 	}
// 	end := time.Since(start)
// 	fmt.Println("Waktu eksekusi:", end)
// }
