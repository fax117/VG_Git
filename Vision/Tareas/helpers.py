# Helper functions

import os
import glob # library for loading images from a directory
import cv2
import numpy as np

# This function loads in images and their labels and places them in a list
# The list contains all images and their associated labels
# For example, after data is loaded, im_list[0][:] will be the first image-label pair in the list
def load_dataset(image_dir):
    
    # Populate this empty image list
    im_list = []
    image_types = ["day", "night"]
    
    # Iterate through each color folder
    for im_type in image_types:
        
        # Iterate through each image file in each image_type folder
        # glob reads in any image with the extension "image_dir/im_type/*"
        for file in glob.glob(os.path.join(image_dir, im_type, "*")):
            
            # Read in the image
            im = cv2.imread(file)
            
            # Check if the image exists/if it's been correctly read-in
            if not im is None:
                # Append the image, and it's type (red, green, yellow) to the image list
                im_list.append((im, im_type))

    return im_list

## Standardize the input images
# Resize each image to the desired input size: 600x1100px (hxw).
# This function should take in an RGB image and return a new, standardized version
def standardize_input(image, width, height):
    
    # Resize image and pre-process so that all "standard" images are the same size
    # cv2.resize
    dimensions = (width, height)
    #Standardize first -> BRG to RGB
    #image_copy = np.copy(image)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    #Resize image
    standard_im = cv2.resize(image, dimensions, interpolation = cv2.INTER_AREA)
    
    return standard_im

# With each loaded image, we also specify the expected output. 
# For this, we use binary numerical values 0/1 = night/day.
# Examples: 
# encode("day") should return: 1
# encode("night") should return: 0
def encode(label):
        
    numerical_val = 0
    if(label == "day"):
        numerical_val = 1
    elif(label == "night"):
        numerical_val = 0
    
    return numerical_val


## Standardize the output using both functions above, standardize the input images and output labels
def standardize(image_list):
    
    # Empty image data array
    standard_list = []

    # Iterate through all the image-label pairs
    for item in image_list:
        
        # Standardize the image
        standardImage = standardize_input(item[0], 1100, 600)
        
        # Create a numerical label
        numLabel = encode(item[1])
        
        # Append the image, and its one hot encoded label to the full, processed list of image data
        #standard_list.append((image_list[item][0],image_list[item][1]))
        standard_list.append((standardImage, numLabel))
    
    return standard_list