import { Image } from "react-native";
import RNFetchBlob from "rn-fetch-blob";
import * as ImagePicker from "expo-image-picker";
import { ImageDimensions, ImageFileUri, ImageUrl } from "./types";
import {
  ImageDownloadError,
  ImageLoadFromGalleryError,
  ImageMetadataLoadingError,
  ImageTooLargeError,
} from "./errors";

export async function importImageFromPhoneGallery(): Promise<
  (ImageFileUri & Partial<ImageDimensions>) | null
> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      base64: false,
    });
    if (result.cancelled) {
      return null;
    }
    const { uri, width, height } = result;
    if (uri) {
      return {
        width,
        height,
        imageFileUri: uri,
      };
    }
    throw new Error("uri is falsy");
  } catch (e) {
    console.error(e);
    throw new ImageLoadFromGalleryError();
  }
}

type CancellablePromise<T> = {
  cancel: () => void;
  resultPromise: Promise<T>;
};

function downloadImageToFile({
  imageUrl,
}: ImageUrl): CancellablePromise<ImageFileUri> {
  const downloadTask = RNFetchBlob.config({ fileCache: true }).fetch(
    "GET",
    imageUrl,
  );
  return {
    resultPromise: downloadTask
      .then(res => ({ imageFileUri: "file://" + res.path() }))
      .catch(e => {
        if (e.message === "canceled") throw e;
        throw new ImageDownloadError();
      }),
    cancel: downloadTask.cancel,
  };
}

export function loadImageToFileWithDimensions(
  source: ImageUrl,
): CancellablePromise<ImageFileUri & Partial<ImageDimensions>> {
  const { imageUrl } = source;
  const { resultPromise, cancel } = downloadImageToFile({
    imageUrl,
  });
  return {
    resultPromise: Promise.all([loadImageSizeAsync(imageUrl), resultPromise])
      .then(([dims, { imageFileUri }]) => ({
        width: dims.width,
        height: dims.height,
        imageFileUri,
      }))
      .catch(e => {
        cancel();
        throw e;
      }),
    cancel,
  };
}

export async function loadImageSizeAsync(
  url: string,
): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      url,
      (width, height) => {
        resolve({ width, height });
      },
      error => {
        console.error(error);
        if (error?.message?.startsWith("Pool hard cap violation? ")) {
          reject(new ImageTooLargeError());
        } else {
          reject(new ImageMetadataLoadingError());
        }
      },
    );
  });
}

/**
 * @param imageDimensions dimensions of the image to resize
 * @param boxDimensions dimensions of the constraint "box" to fit in
 * @returns new dimensions with the aspect ratio of imageDimensions that fit in boxDimensions
 */
export function fitImageContain(
  imageDimensions: ImageDimensions,
  boxDimensions: ImageDimensions,
): ImageDimensions {
  const { height: imageHeight, width: imageWidth } = imageDimensions;
  const { height: boxHeight, width: boxWidth } = boxDimensions;
  if ([boxHeight, boxWidth, imageHeight, imageWidth].some(val => val === 0))
    return boxDimensions;
  if (imageHeight <= boxHeight && imageWidth <= boxWidth)
    return {
      width: imageWidth,
      height: imageHeight,
    };
  if (imageWidth / imageHeight >= boxWidth / boxHeight) {
    /**
     * Width of the box is the biggest constraint (image is wider than the box
     * in terms of aspect ratio)
     *
     * Given this condition, do some basic math on the inequality and we have:
     *
     * (1). imageWidth / imageHeight >= boxWidth / boxHeight    (the inequality in the "if" condition)
     * (2). boxHeight / boxWidth >= imageHeight / imageWidth    (carefully invert (1))
     * (3). boxHeight >= (imageHeight / imageWidth) * boxWidth  (multiply (2) by boxWidth)
     *
     * -> (3) shows that the resulting height (below) is smaller than boxHeight.
     *    so the returned value "fits" in the box.
     *
     * */
    return {
      width: boxWidth,
      height: (imageHeight / imageWidth) * boxWidth,
    };
  }
  /**
   * Height of the box is the biggest constraint
   * */
  return {
    width: (imageWidth / imageHeight) * boxHeight,
    height: boxHeight,
  };
}
