// EASY-TO-EDIT PHOTO CONFIG
// file    : filename inside assets/photos/
// caption : text shown under the picture
// wall    : "north" or "south" (which long wall it hangs on)
// x       : position along the wall, from -16 (west end) to 16 (east end)
// order   : visiting order (1 = first)
// Pictures keep their own aspect ratio automatically. Add or remove entries freely (6-10 recommended).
const PHOTOS = [
  { file: "photo1.jpg", caption: "Where our story became special ❤️",                              wall: "north", x: -14, order: 1 },
  { file: "photo2.jpg", caption: "One of my favourite memories.",                                  wall: "north", x: -5,  order: 2 },
  { file: "photo3.jpg", caption: "Every moment with you is worth remembering.",                    wall: "north", x: 5,   order: 3 },
  { file: "photo4.jpg", caption: "You make even ordinary days beautiful.",                         wall: "north", x: 14,  order: 4 },
  { file: "photo5.jpg", caption: "Little moments, endless memories.",                              wall: "south", x: 14,  order: 5 },
  { file: "photo6.jpg", caption: "Your smile is my favourite view.",                               wall: "south", x: 5,   order: 6 },
  { file: "photo7.jpg", caption: "Even far apart, you are always with me.",                        wall: "south", x: -5,  order: 7 },
  { file: "photo8.jpg", caption: "Out of all the places in this world, my favourite place is beside you.", wall: "south", x: -14, order: 8 }
];
