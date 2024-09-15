export function nearestNeighborInterpolation(
  img: ImageData,
  newWidth: number,
  newHeight: number
) {
  const originalWidth = img.width; // Получаем оригинальную ширину изображения
  const originalHeight = img.height; // Получаем оригинальную высоту изображения
  const scaleX = originalWidth / newWidth; // Вычисляем масштаб по ширине
  const scaleY = originalHeight / newHeight; // Вычисляем масштаб по высоте
  const newData = new Uint8ClampedArray(newWidth * newHeight * 4); // Создаем новый массив для новых данных изображения

  for (let y = 0; y < newHeight; y++) {
    // Итерируемся по новой высоте изображения
    for (let x = 0; x < newWidth; x++) {
      // Итерируемся по новой ширине изображения
      const px = Math.floor(x * scaleX); // Вычисляем координату x исходного пикселя
      const py = Math.floor(y * scaleY); // Вычисляем координату y исходного пикселя
      const index = (y * newWidth + x) * 4; // Вычисляем индекс текущего пикселя в новых данных
      const originalIndex = (py * originalWidth + px) * 4; // Вычисляем индекс исходного пикселя в исходных данных

      // Копируем цветовую информацию из исходного пикселя в новый пиксель
      newData[index] = img.data[originalIndex]; // Копируем значение красного канала
      newData[index + 1] = img.data[originalIndex + 1]; // Копируем значение зеленого канала
      newData[index + 2] = img.data[originalIndex + 2]; // Копируем значение синего канала
      newData[index + 3] = img.data[originalIndex + 3]; // Копируем значение альфа канала
    }
  }
  return new ImageData(newData, newWidth, newHeight);
}
