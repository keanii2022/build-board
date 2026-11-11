// Build Board pet: the pixel library.
// Every picture is a little text grid. '.' is empty, every other letter is a colour from PAL.
// Add your own: push an object into ITEMS (treats) or SNACKS (first push of the day) and forget it exists.
//   kind "hold"  = it sits in the pet's hands beside it
//   kind "shelf" = it lives in the closet (the chart beside the pet), and beside the pet for a day after it drops
//   kind "wear"  = painted onto the pet. proc: "chain" | "shades" | "cartier" | "grill" | "belly" | "swap" | "hat" | "wrist" | "lip"
// The pet never tells you what's left in the pool. Neither should you look.

export const PAL = {
  k: "#15161a", x: "#2a2d36", y: "#5c606b", Y: "#a9adb8", w: "#f2f2f4", c: "#f1dcb4",
  s: "#cfc9ff", d: "#8a80e6", p: "#ff8ab8", g: "#f4c64f", G: "#b8871b", r: "#e4453a",
  u: "#7b3fd1", b: "#4f8df7", o: "#ff8a3d", t: "#39d0c4", n: "#8a5a2b", e: "#4cc26b",
  a: "#d9a066", N: "#5a3a1b", E: "#2f8a4a", B: "#2f5fb0", R: "#9b2a24",
};

export const ITEMS = [
  { id: "chain", price: 42, name: "iced out chain", kind: "wear", proc: "chain", line: "iced out. on a widget salary." },
  { id: "shades", price: 18, name: "shades", kind: "wear", proc: "shades", line: "can't see the bugs now." },
  { id: "cup", price: 18, name: "double cup", kind: "hold", line: "sippin' on step syrup.", grid: [
    "........r..", "........r..", "..kkkkkkk..", ".kwwwwwwwk.", ".kwuuuuuwk.", ".kwwwwwwwk.", ".kwwwwwwwk.", "..kwwwwwk..", "..kwYYYwk..", "..kwwwwwk..", "...kwwwk...", "...kkkkk..."] },
  { id: "phones", price: 24, name: "iphone duo", kind: "hold", line: "one for work. one for the group chat.", grid: [
    "kkkkkk.kkkkkk", "kxkkxk.kxkkxk", "kbbbbk.kbbbbk", "kbwbwk.kbwbwk", "kbbbbk.kbbbbk", "kbwbwk.kbwbwk", "kbbbbk.kbbbbk", "kbbbbk.kbbbbk", "kxxxxk.kxxxxk", "kkkkkk.kkkkkk"] },
  { id: "bag", price: 42, name: "designer bag", kind: "shelf", line: "the bag cost more than the laptop.", grid: [
    "....kkkkkk....", "...kk....kk...", "...k......k...", "...k......k...", ".kkkkkkkkkkkk.", ".kaaaaaaaaaak.", ".kaNaaNaaNaak.", ".kaaaaaaaaaak.", ".kaaaaggaaaak.", ".kaNaaggaaNak.", ".kaaaaaaaaaak.", ".kaNaaNaaNaak.", ".kkkkkkkkkkkk."] },
  { id: "gta6", price: 36, name: "gta 6", kind: "shelf", line: "it came out before your project did.", grid: [
    "kkkkkkkkkkkk", "kppppppppppk", "kpppgggppppk", "kppgggggpppk", "kooogggooook", "kooooooooook", "kuuuuuuuuuuk", "kuwuuuwuwuuk", "kuwuuuwuwuuk", "kuuwuwuuwuuk", "kuuuwuuuwuuk", "kuuuuuuuuuuk", "kkkkkkkkkkkk"] },
  { id: "glock", price: 30, name: "glock 40 w/ drum", kind: "hold", line: "for the bugs. only the bugs.", grid: [
    ".kkkkkkkkkkkkk.", "kYYYYYYYYYYYYYk", "kxxxxxxxxxxxxxk", "kkkkkkkkkxxxxxk", ".......kkxxxxk.", "......kxkkxxxk.", "......kkkkxxxk.", ".........kxxxk.", "........kkkkkk.", ".......kxxxxxxk", ".......kxxkkxxk", ".......kxxkkxxk", "........kxxxxk.", ".........kkkk.."] },
  { id: "grill", price: 30, name: "gold grill", kind: "wear", proc: "grill", line: "the smile is worth four steps." },
  { id: "bucket", price: 18, name: "bucket hat", kind: "wear", proc: "hat", line: "fisherman of steps.", grid: [
    "...kkkkkk...", "..kkkkkkkk..", ".kkkkkkkkkk.", "kkkkkkkkkkkk"] },
  { id: "cash", price: 24, name: "rubber band money", kind: "hold", line: "it's monopoly money. don't tell it.", grid: [
    ".kkkkkkkkkkk.", "keeeennEeeeek", "keEEennEEeeek", "keEwwnnwwEeek", "keEEennEEeeek", "keeeennEeeeek", "kEEEEnnEEEEEk", ".kkkkkkkkkkk.", "kkkkkkkkkkkkk", "kEEEEnnEEEEEk", ".kkkkkkkkkkk."] },
  { id: "rolex", price: 60, name: "the watch", kind: "wear", proc: "wrist", line: "the time is: commit.", grid: [
    "...kkkkk...", "...kgGgk...", "...kGgGk...", "...kgGgk...", "..kkkkkkk..", ".kgggggggk.", "kggwwwwwggk", "kgwwwkwwwgk", "kgwwwkwwwgk", "kgwwwkkkwgk", "kgwwwwwwwgk", ".kgggggggk.", "..kkkkkkk..", "...kgGgk...", "...kGgGk...", "...kgGgk...", "...kkkkk..."] },
  { id: "bottoms", price: 42, name: "red bottoms", kind: "shelf", line: "red bottoms, green CI.", grid: [
    "..........kkkk", ".........kkYYk", "........kkYYYk", ".......kkYYYYk", "......kkYkkkkk", "....kkxxxxxxxk", ".kkxxxxxxxxxxk", "kxxxxxxxxxxxxk", "krrrrrrrrrrrkk", "..........rrkk", "..........rrkk", "..........rrkk"] },
  { id: "bala", price: 18, name: "balaclava", kind: "wear", proc: "swap", swap: { s: "k", d: "x" }, line: "no face, no case." },
  { id: "blunt", price: 12, name: "medicinal", kind: "wear", proc: "lip", line: "for medicinal step purposes.", grid: [
    "........Y..", ".......Y...", "........Y..", "kkkkkkkkkk.", "knnnnnnnkor", "kNnNnNnnkor", "kkkkkkkkkk."] },
  { id: "ps5", price: 36, name: "the console", kind: "shelf", line: "it's for the loading screens.", grid: [
    ".kk......kk.", ".kwk....kwk.", ".kwwkkkkwwk.", ".kwwkxxkwwk.", ".kwwkxxkwwk.", ".kwwkbxkwwk.", ".kwwkxxkwwk.", ".kwwkxxkwwk.", ".kwwkxxkwwk.", ".kwwkxxkwwk.", ".kwwkkkkwwk.", ".kwk....kwk.", ".kk......kk.", "kkkkkkkkkkkk"] },
  { id: "key", price: 60, name: "lambo key", kind: "hold", line: "the lambo is in the other widget.", grid: [
    "...kkk...", "..kY.Yk..", "..kY.Yk..", "...kkk...", "...kkk...", ".kkxxxkk.", "kxxxxxxxk", "kxxgggxxk", "kxxgrgxxk", "kxxgggxxk", "kxxxxxxxk", "kxxbxbxxk", "kxxxxxxxk", ".kkkkkkk."] },
  { id: "laptop", price: 24, name: "tiny laptop", kind: "shelf", line: "it has your repos open. all of them.", grid: [
    "..kkkkkkkkkk..", "..kxxxxxxxxk..", "..kxeexxxxxk..", "..kxxbbbxxxk..", "..kxppxxxxxk..", "..kxxeeexxxk..", "..kxxxxxxxxk..", "..kkkkkkkkkk..", "kkYYYYYYYYYYkk", "kYyyyyyyyyyyYk", "kkkkkkkkkkkkkk"] },
  { id: "plant", price: 12, name: "a plant", kind: "shelf", line: "photosynthesizes your commits.", grid: [
    "....ee..ee..", "...eEee.eEe.", "..eeEeeeeEee", "...eeEeeEee.", "....eeEEe...", ".....eEe....", "......e.....", ".kkkkkkkkkk.", ".knnnnnnnnk.", "..kooooook..", "..kooooook..", "...kooook...", "....kkkk...."] },
  { id: "lamp", price: 18, name: "mood lamp", kind: "shelf", line: "mood lighting for the grind.", grid: [
    "...kk...", "..kYYk..", "..kkkk..", ".kuuuuk.", ".kupuuk.", ".kuppuk.", ".kuuuuk.", ".kuuppk.", ".kupppk.", ".kuuuuk.", ".kuppuk.", "..kkkk..", "..kxxk..", ".kxxxxk.", ".kkkkkk."] },
  { id: "duck", price: 12, name: "rubber duck", kind: "shelf", line: "it listens better than you.", grid: [
    "...kkkk......", "..kggggk.....", ".kggkgggk....", ".kgggggggkkk.", ".kggggggkoook", "..kgggggkkkk.", "...kgggk.....", ".kkkkggggkkk.", "kgggggggggggk", "kgggggggggggk", ".kgggggggggk.", "..kkkkkkkkk.."] },
  { id: "energy", price: 12, name: "cursed energy drink", kind: "hold", line: "400mg. do not.", grid: [
    "..kkkk..", ".kYYYYk.", ".kkkkkk.", ".kttttk.", ".kttggk.", ".ktgggk.", ".kggggk.", ".kgggtk.", ".kggttk.", ".ktgttk.", ".kttttk.", ".kkkkkk."] },
  { id: "hoodie", price: 24, name: "pink hoodie", kind: "wear", proc: "swap", swap: { s: "p", d: "r" }, line: "it's giving." },
  { id: "durag", price: 18, name: "durag", kind: "wear", proc: "hat", line: "waves on waves.", grid: [
    "...uuuuuu...", "..uuuuuuuuu.", ".uuuuuuuuuuu", "...........u"] },
  { id: "cartier", price: 36, name: "buffs", kind: "wear", proc: "cartier", line: "the frames see everything." },
  { id: "tee", price: 18, name: "the V tee", kind: "wear", proc: "belly", line: "V." },
  { id: "monitor", price: 24, name: "second monitor", kind: "shelf", line: "obviously.", grid: [
    "kkkkkkkkkkkkkkkk", "kxxxxxxxxxxxxxxk", "kxeeexxxxxxxxxxk", "kxxxbbbbxxxxxxxk", "kxppxxxxxxxxxxxk", "kxxxeeeeexxxxxxk", "kxxxxxxxxxxxxxxk", "kxxxxxxxxxxxxxxk", "kkkkkkkkkkkkkkkk", ".......kk.......", ".......kk.......", "....kkkkkkkk....", "....kYYYYYYk...."] },
  { id: "hammock", price: 24, name: "hammock", kind: "shelf", line: "for the stuffed days.", grid: [
    "k..............k", "kk............kk", "k.kk........kk.k", "k...kkkkkkkk...k", "k...kcccccck...k", "k...kcacaack...k", "k....kcccck....k", "k.....kkkk.....k", "kk............kk"] },
  { id: "couch", price: 30, name: "therapist couch", kind: "shelf", line: "tell me about your merge conflicts.", grid: [
    ".kkkkk..........", ".kbbbbk.........", ".kbBbbk.........", ".kbbbbkkkkkkkkk.", ".kbbbbbbbbbbbbbk", "kbBbbBbbBbbBbbbk", "kbbbbbbbbbbbbbbk", "kkkkkkkkkkkkkkkk", ".kk..........kk."] },
  { id: "friend", price: 30, name: "a friend", kind: "shelf", line: "it has its own opinions.", grid: [
    ".tt....tt.", "ttttttttttt", "tkttttttkt", "tttttttttt", "ttpttttptt", "tttkkktttt", ".tttttttt.", "..tttttt.."] },
  { id: "crown", price: 60, name: "crown", kind: "wear", proc: "hat", line: "king of the board.", grid: [
    "g...g...g", "gg.ggg.gg", "ggggggggg", "grgggbggg", "ggggggggg"] },
  { id: "sneaker", price: 42, name: "chunky designer sneaker", kind: "shelf", line: "the shoe is the outfit.", grid: [
    "......kkkkk.....", ".....kYYYYYk....", "....kYwwYYYYk...", "...kYYwwYYYYYkk.", "..kYYYYYYYYYYYYk", ".kYYYkkkkkYYYYYk", "kYYYYYYYYYYYYYYk", "kwwwwwwwwwwwwwwk", "kwwwwwwwwwwwwwwk", ".kkkkkkkkkkkkkk."] },
  { id: "cigs", price: 12, name: "pack of cigs", kind: "hold", line: "step break.", grid: [
    "..kkkkk..", "..kwwwk..", "..kwowk..", "kkkkkkkkk", "krrrrrrrk", "krrrrrrrk", "krrwwwrrk", "kwwwwwwwk", "kwwwwwwwk", "kwwrrrwwk", "kwwwwwwwk", "kkkkkkkkk"] },

// ── the second shelf ──
  { id: "skate", price: 24, name: "skateboard", kind: "shelf", line: "kickflip over the backlog.", grid: [
    "..kkkkkkkkkkkk..", ".kppppppppppppk.", ".kppppppppppppk.", "..kkkkkkkkkkkk..", "...kk......kk...", "..kxxk....kxxk..", "...kk......kk..."] },
  { id: "keys", price: 24, name: "mech keyboard", kind: "shelf", line: "thock. thock. thock.", grid: [
    "kkkkkkkkkkkkkkkk", "kYYYYYYYYYYYYYYk", "kYpYbYpYbYpYbYpk", "kYbYpYbYpYbYpYbk", "kYYYYpppppYYYYYk", "kkkkkkkkkkkkkkkk"] },
  { id: "chair", price: 30, name: "gaming chair", kind: "shelf", line: "lumbar support for the grind.", grid: [
    "...kkkkkk...", "..krrrrrrk..", "..krkkkkrk..", "..krrrrrrk..", "..krkrrkrk..", "..krrrrrrk..", "..krkrrkrk..", "..krrrrrrk..", ".kkkkkkkkkk.", ".krrrrrrrrk.", ".kkkkkkkkkk.", ".....kk.....", "..kkkkkkkk..", "..kxxkkxxk.."] },
  { id: "espresso", price: 24, name: "espresso machine", kind: "shelf", line: "double shot, double commit.", grid: [
    ".kkkkkkkkkk.", ".kYYYYYYYYk.", ".kYrYYYYYYk.", ".kkkkkkkkkk.", ".kxxkkkkxxk.", ".kxxkYYkxxk.", ".kxxxkkxxxk.", ".kxxxwwxxxk.", ".kxxxwwxxxk.", ".kxxkkkkxxk.", ".kkkkkkkkkk.", "kkkkkkkkkkkk"] },
  { id: "vinyl", price: 24, name: "turntable", kind: "shelf", line: "lo-fi beats to ship to.", grid: [
    "kkkkkkkkkkkkkk", "kaaaaaaaaaaaak", "kaakkkkkaaYaak", "kakxxxxxkaYaak", "kakxxpxxkaYaak", "kakxxxxxkaaaak", "kaakkkkkaaaaak", "kaaaaaaaaaaaak", "kkkkkkkkkkkkkk"] },
  { id: "disco", price: 30, name: "disco ball", kind: "shelf", line: "every merge is a party.", grid: [
    "....kk....", "....kk....", "...kkkk...", "..kYwYwk..", ".kwYwYwYk.", "kYwYwYwYwk", "kwYwYwYwYk", "kYwYwYwYwk", ".kwYwYwYk.", "..kYwYwk..", "...kkkk..."] },
  { id: "neon", price: 36, name: "neon sign", kind: "shelf", line: "it says SHIP. it means it.", grid: [
    "kkkkkkkkkkkkkkkkk", "kxxxxxxxxxxxxxxxk", "kxpppxpxpxpxpppxk", "kxpxxxpxpxpxpxpxk", "kxpppxpppxpxpppxk", "kxxxpxpxpxpxpxxxk", "kxpppxpxpxpxpxxxk", "kxxxxxxxxxxxxxxxk", "kkkkkkkkkkkkkkkkk"] },
  { id: "cat", price: 30, name: "a cat", kind: "shelf", line: "it sits on the keyboard. on purpose.", grid: [
    "..k.....k...", "..kk...kk...", "..koooooook.", "..kokoookok.", "..kooooooook", ".koooNoooook", "kooooooooook", "kkkkkkkkkkkk"] },
  { id: "tank", price: 24, name: "fish tank", kind: "shelf", line: "the fish has seen things.", grid: [
    "kkkkkkkkkkkkkk", "kbbbbbbbbbbbbk", "kbbbobbbbbbbbk", "kbboookbbbbbbk", "kbbbobbbbebbbk", "kbbbbbbbbebbbk", "kbbbbbbbeeebbk", "kbbbbbbbbebbbk", "kaaaaaaaaaaaak", "kkkkkkkkkkkkkk"] },
  { id: "drone", price: 30, name: "drone", kind: "hold", line: "for aerial shots of the bug.", grid: [
    "kkk.......kkk", ".k.........k.", ".kkkkkkkkkkk.", "kxxxkxxxkxxxk", ".kkkkxxxkkkk.", "....kxrxk....", "....kkkkk...."] },
  { id: "camera", price: 24, name: "polaroid", kind: "hold", line: "say commit.", grid: [
    "...kkkk....", "kkkkYYkkkkk", "kYYYYYYYYYk", "kYYkkkkYYrk", "kYkxxxxkYYk", "kYkxwxxkYYk", "kYYkkkkYYYk", "kwwwwwwwwwk", "kkkkkkkkkkk"] },
  { id: "bike", price: 30, name: "fixie", kind: "shelf", line: "no brakes. like main.", grid: [
    "........kk..kkk.", ".......k..k.k...", ".....kkkkkkk....", "....k..k...k....", "...k...k....k...", "..kkk.k.k...kkk.", ".k...kk..kkk...k", ".k...k....k....k", "..kkk......kkk.."] },
  { id: "toilet", price: 60, name: "gold toilet", kind: "shelf", line: "the throne.", grid: [
    "..kkkkkk..", "..kggggk..", "..kggggk..", "..kggggk..", "kkkkkkkkkk", "kggwwwwggk", "kggwwwwggk", ".kggggggk.", "..kggggk..", "..kggggk..", "..kkkkkk.."] },
  { id: "ring", price: 60, name: "the ring", kind: "hold", line: "it's not for anyone. it's for the pet.", grid: [
    "...w...", "..wsw..", ".wsssw.", "..wsw..", ".kgggk.", "kg...gk", "kg...gk", ".kgggk."] },
  { id: "champagne", price: 30, name: "champagne", kind: "hold", line: "pop it on green CI.", grid: [
    "..kk..", ".kggk.", ".kggk.", ".kkkk.", ".kEEk.", "kEEEEk", "kEEEEk", "kEgggk", "kEgggk", "kEEEEk", "kEEEEk", "kEEEEk", ".kkkk."] },
  { id: "briefcase", price: 42, name: "the briefcase", kind: "hold", line: "don't ask what's inside.", grid: [
    "....kkkkk....", "....k...k....", "kkkkkkkkkkkkk", "kNNNNNNNNNNNk", "kNNNNNNNNNNNk", "kNNNNNgNNNNNk", "kNNNNNNNNNNNk", "kNNNNNNNNNNNk", "kkkkkkkkkkkkk"] },
  { id: "trip", price: 36, name: "the trip", kind: "hold", line: "out of office. forever.", grid: [
    "..kkkkkkk..", "..kBBBBBk..", "..kBBgBBk..", "..kBgggBk..", "..kBBgBBk..", "..kBBBBBk..", "kkkkkkkkkkk", "kwwwwkwwwwk", "kwrrwkwwrwk", "kwwwwkwwwwk", "kkkkkkkkkkk"] },
  { id: "cowboy", price: 24, name: "cowboy hat", kind: "wear", proc: "hat", line: "yeehaw, ship.", grid: [
    "....kkkkk.....", "....kaaak.....", "kkkkkaaakkkkkk", ".kaaaaaaaaaak."] },
  { id: "beanie", price: 18, name: "beanie", kind: "wear", proc: "hat", line: "cold outside. warm cache.", grid: [
    "...kkkkkk...", "..krrrrrrk..", ".krrrrrrrrk.", "kkkkkkkkkkkk", "kwwwwwwwwwwk"] },
  { id: "halo", price: 36, name: "halo", kind: "wear", proc: "hat", line: "an angel. allegedly.", grid: [
    "..gggggggg..", ".g........g.", "..gggggggg.."] },
  { id: "horns", price: 36, name: "devil horns", kind: "wear", proc: "hat", line: "force pushed once.", grid: [
    "r.........r", "rr.......rr", ".rr.....rr."] },
  { id: "katana", price: 42, name: "katana", kind: "hold", line: "for slicing the PR into smaller ones.", grid: [
    "kkkkkkkkkkkkkkk.", "krkrkrgYYYYYYYYk", "krkrkrgwwwwwwwk.", "kkkkkkkkkkkkkk.."] },
  { id: "plushie", price: 18, name: "a plushie", kind: "shelf", line: "emotional support.", grid: [
    ".kk....kk.", "knnk..knnk", ".knnnnnnk.", ".knknnknk.", ".knnnnnnk.", ".knnNNnnk.", "kknnnnnnkk", "knnnnnnnnk", "knnkkkknnk", ".kkk..kkk."] },
  { id: "fridge", price: 24, name: "mini fridge", kind: "shelf", line: "energy drinks only.", grid: [
    "kkkkkkkkkk", "kYYYYYYYYk", "kYYYYYYYkk", "kYYYYYYYxk", "kYYYYYYYxk", "kYYYYYYYYk", "kkkkkkkkkk", "kYYYYYYYYk", "kYYYYYYYxk", "kYYYYYYYxk", "kYYYYYYYYk", "kkkkkkkkkk"] },
];

// ── Friends: a secret collection. Not for sale, no hints; each one shows up when you've done the thing. ──
// The rules live in index.jsx (FRIEND_RULES). Add a creature here and a rule there.
export const FRIENDS = [
  { id: "friend", name: "the first one", line: "it has its own opinions.", grid: [
    ".tt....tt.", "tttttttttt", "tkttttttkt", "tttttttttt", "ttpttttptt", "tttkkktttt", ".tttttttt.", "..tttttt.."] },
  { id: "owl", name: "the night owl", line: "it saw the 3am push. it says nothing.", grid: [
    "u........u", "uu......uu", "uuuuuuuuuu", "uwwuuuuwwu", "uwkuuuuwku", "uuuuggguuu", "uuuuuuuuuu", ".uuuuuuuu.", "..uu..uu.."] },
  { id: "lark", name: "the early bird", line: "up before the dock loads.", grid: [
    "...oo.....", "..okoo....", "..oooo.gg.", ".oooooooo.", "ooooooooo.", ".oooooooo.", "..oooooo..", "...o..o...", "...k..k..."] },
  { id: "ember", name: "the ember", line: "seven days. it's warm now.", grid: [
    "....r.....", "...ror....", "..rooor...", ".roooggor.", ".rooggoor.", ".roooooor.", "..rooooor.", "...rwrwr..", "....rrr..."] },
  { id: "closer", name: "the closer", line: "100%. framed. it watched.", grid: [
    "..gggggg..", ".gGGGGGGg.", "gGwwGGwwGg", "gGkwGGkwGg", "gGGGGGGGGg", "gGGkkkkGGg", ".gGGGGGGg.", "..gggggg..", "..g....g.."] },
  { id: "courier", name: "the courier", line: "five pushes before lunch. respect.", grid: [
    "..bbbbbb..", ".bBBBBBBb.", "bBwwBBwwBb", "bBkwBBkwBb", "bBBBBBBBBb", ".bBBkkBBb.", "..bbbbbb..", ".bb....bb.", "bb......bb"] },
  { id: "weekender", name: "the weekender", line: "saturday and sunday. who hurt you.", grid: [
    "...eeee...", "..eEEEEe..", ".eEwwEwwEe", ".eEkwEkwEe", ".eEEEEEEEe", ".eEEkkkEEe", "..eEEEEe..", "...eeee...", "..ee..ee.."] },
  { id: "hoarder", name: "the hoarder", line: "twenty things. it keeps the receipts.", grid: [
    "..nnnnnn..", ".nNNNNNNn.", "nNwwNNwwNn", "nNkwNNkwNn", "nNNNNNNNNn", "nNNkNNkNNn", ".nNNkkNNn.", "..nnnnnn..", ".nn.nn.nn."] },
  { id: "spinner", name: "the spinner", line: "ten spins. it's fine. it's fine.", grid: [
    "..pppppp..", ".pppppppp.", "pwpwppwpwp", "pkwkppkwkp", "pppppppppp", "ppkppppkpp", ".ppkkkkpp.", "..pppppp..", ".p..pp..p."] },
  { id: "revenant", name: "the revenant", line: "it came back too.", grid: [
    "..YYYYYY..", ".YwwwwwwY.", "YwxxwwxxwY", "YwxxwwxxwY", "YwwwwwwwwY", "YwwwkwwwwY", ".YwwwwwwY.", "..YwYwYw..", "..Y.Y.Y..."] },
];

export const SNACKS = [
  { id: "boba", name: "boba", line: "70% sugar, 30% tapioca, 100% deserved.", grid: ["...r..", ".wwrw.", ".wcccw", ".wcccw", ".wcccw", ".wkkcw", ".wkkkw", "..www."] },
  { id: "ramen", name: "desk ramen", line: "ramen at the desk. like a pro.", grid: ["..cYcYc.", ".cccccc.", "rrrrrrrr", ".rrrrrr.", "..rrrr.."] },
  { id: "chips", name: "hot chips", line: "fingers red. CI red. balance.", grid: ["rrrrrr", "rorror", "rrrrrr", "rrorrr", "rrrrrr", "rorror", "rrrrrr"] },
  { id: "flurry", name: "mcflurry", line: "the machine worked. a sign.", grid: ["..r...", ".wwwww", ".wwwww", ".wwwww", ".wkwkw", "..www."] },
  { id: "cookie", name: "a cookie", line: "basic. still ate it.", grid: [".nnnn.", "nnknnn", "nnnnkn", "nknnnn", "nnnknn", ".nnnn."] },
  { id: "taco", name: "taco", line: "taco tuesday is a state of mind.", grid: ["..cccc..", ".ceeeec.", "ccerrecc", "cccccccc"] },
  { id: "pizza", name: "cold pizza", line: "cold pizza, warm push.", grid: ["ccccccc", ".crcrc.", ".ccccc.", "..crc..", "..ccc..", "...c..."] },
  { id: "sushi", name: "gas station sushi", line: "living dangerously.", grid: [".rrrr..", ".wwww..", "kkkkkkk", "kwwwwwk", "kkkkkkk"] },
  { id: "banana", name: "a banana", line: "health. we don't know her.", grid: [".....g.", "....gg.", "...ggg.", ".gggg..", "gggg...", "ggg...."] },
  { id: "burger", name: "burger", line: "no fries. fries are for prod.", grid: [".cccccc.", "cccccccc", "eeeeeeee", "nnnnnnnn", "cccccccc", ".cccccc."] },
];

export const EXTRA = {
  trophy: ["ggggggg", ".ggggg.", ".ggggg.", "..ggg..", "...g...", "..ggg..", ".ggggg."],
  flame: ["..o...", ".oo.o.", ".ooooo", ".oroo.", ".orro.", "..rr.."],
  coin: [".ggg.", "gGGGg", "gGgGg", "gGGGg", ".ggg."],
  chart: ["....b", "..t.b", "..t.b", "p.t.b", "p.t.b", "p.t.b"],   // the tiny bar chart beside the pet: click it for the stats card
  box: ["nnnnnnnn", "nnncnnnn", "ccccccc", "nnncnnnn", "nnncnnnn", "nnnnnnnn"],
  grave: ["..kkkkk..", ".kYYYYYk.", "kYYYYYYYk", "kYYkkkYYk", "kYYYkYYYk", "kYYYkYYYk", "kYYYYYYYk", "kYYYYYYYk", "kkkkkkkkk", "eeeeeeeee"],
  egg: ["....wwww....", "...wwwwww...", "..wwwwpwww..", "..wwwwwwww..", ".wwwpwwwwww.", ".wwwwwwwpww.", ".wwwwwwwwww.",
        ".wwpwwwwwww.", ".wwwwwwpwww.", "..wwwwwwww..", "..wwwwwwww..", "...wwwwww...", "....wwww...."],
};

// ── The pet itself, drawn on the fly from a few numbers ─────────────────────
// stage 0..6 = slim, thicc, fat, cooked, on the scooter, obese, a ball.  face = "fed" | "peckish" | "hungry" | "ghost" | "stuffed"
// Returns { body: rows, pupils: rows (same size, only the pupils), anchors } so the eyes can follow the cursor.
export function drawPet(o) {
  const stage = o.stage || 0, face = o.face || "fed", wear = o.wear || [];
  const rx = [6, 7.5, 9.5, 11.5, 12, 13, 14][stage], ry = [5, 5.5, 6.5, 7.5, 7.5, 8, 8.5][stage];
  const scooter = stage === 4, ghost = face === "ghost", big = Math.max(0, stage - 4) * 3;   // past the scooter the body balloons
  // Under the head: a round chubby body tucked behind the chin, a stubby arm each side, two little feet. A ghost is just the head.
  const ex = ghost ? 0 : 3 + big;   // extra room each side for the arms
  const brx = rx + 1 + big, bry = Math.round(ry * 0.85) + big;
  const W = Math.ceil(rx * 2) + (scooter ? 10 : 4) + 4 + ex * 2;
  const cx = Math.floor((Math.ceil(rx * 2) + 4 - 1) / 2) + 2 + (scooter ? 1 : 0) + ex, cy = 6 + ry;
  const base = Math.round(cy + ry);   // the head's last row
  const bcy = base - 2 + bry, bodyBot = Math.round(bcy + bry), feetY = bodyBot;   // the feet poke out of the body's last row
  const H = ghost ? Math.ceil(ry * 2) + 9 : feetY + 3 + (scooter ? 4 : 0);
  const g = blank(W, H), pu = blank(W, H);
  const inside = (x, y, k = 0) => ((x - cx) / (rx - k)) ** 2 + ((y - cy) / (ry - k)) ** 2 <= 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x, y)) g[y][x] = inside(x, y, 1) ? "s" : "d";
  const topY = Math.round(cy - ry);
  const ears = [Math.round(cx - rx * 0.55), Math.round(cx + rx * 0.55)];
  for (const X of ears) {
    put(g, topY - 2, X, "d"); put(g, topY - 1, X - 1, "d"); put(g, topY - 1, X, "s"); put(g, topY - 1, X + 1, "d");
    put(g, topY, X - 1, "d"); put(g, topY, X, "s"); put(g, topY, X + 1, "d"); put(g, topY + 1, X, "s");
  }
  const eyeY = Math.round(cy - 1), dx = Math.round(rx * 0.45);
  const eyes = [Math.round(cx - dx) - 1, Math.round(cx + dx)];
  const sleepy = face === "stuffed" || o.sleepy;
  for (const X of eyes) {
    if (face === "ghost") { put(g, eyeY - 1, X, "x"); put(g, eyeY - 1, X + 1, "x"); put(g, eyeY, X, "x"); put(g, eyeY, X + 1, "x"); }
    else if (sleepy) { put(g, eyeY, X, "k"); put(g, eyeY, X + 1, "k"); }
    else if (face === "hungry") { put(g, eyeY - 1, X, "d"); put(g, eyeY - 1, X + 1, "d"); put(g, eyeY, X, "w"); put(g, eyeY, X + 1, "w"); put(pu, eyeY, X, "k"); put(pu, eyeY, X + 1, "k"); }
    else { put(g, eyeY - 1, X, "w"); put(g, eyeY - 1, X + 1, "w"); put(g, eyeY, X, "w"); put(g, eyeY, X + 1, "w"); put(pu, eyeY, X, "k"); put(pu, eyeY, X + 1, "k"); }
    if (o.bags) { put(g, eyeY + 1, X, "d"); put(g, eyeY + 1, X + 1, "d"); }
  }
  if (face !== "hungry" && face !== "ghost") { put(g, eyeY + 1, eyes[0] - 1, "p"); put(g, eyeY + 1, eyes[1] + 2, "p"); }
  const my = eyeY + 2, mx = Math.round(cx);
  if (face === "hungry" || face === "ghost") { put(g, my, mx - 1, "k"); put(g, my, mx, "k"); put(g, my, mx + 1, "k"); put(g, my - 1, mx - 2, "k"); put(g, my - 1, mx + 2, "k"); }
  else if (face === "stuffed") { put(g, my, mx - 1, "k"); put(g, my, mx, "k"); put(g, my + 1, mx - 1, "k"); put(g, my + 1, mx, "k"); }
  else if (face === "peckish") { put(g, my, mx - 1, "k"); put(g, my, mx, "k"); put(g, my, mx + 1, "k"); }
  else { put(g, my, mx - 1, "k"); put(g, my, mx, "k"); put(g, my, mx + 1, "k"); put(g, my - 1, mx - 2, "k"); put(g, my - 1, mx + 2, "k"); }
  if (stage >= 2) { const by = Math.round(cy + ry * 0.5); for (let x = Math.round(cx - rx * 0.4); x <= Math.round(cx + rx * 0.4); x++) if (g[by][x] === "s") g[by][x] = "d"; }
  if (stage >= 3) { const by = Math.round(cy + ry * 0.15); for (let x = Math.round(cx - rx * 0.25); x <= Math.round(cx + rx * 0.25); x++) if (g[by][x] === "s") g[by][x] = "d"; }
  // the body. hand = [row, col] of each hand, wrist = the pixels a watch sits on (right arm)
  const arms = o.arms || {};
  const hand = { L: null, R: null }, wrist = [];
  const bx = (y) => Math.round(brx * Math.sqrt(Math.max(0, 1 - ((y - bcy) / bry) ** 2)));   // the body's half-width on a row
  const ay = bcy;   // arm row
  if (!ghost) {
    const inBody = (x, y, k = 0) => ((x - cx) / (brx - k)) ** 2 + ((y - bcy) / (bry - k)) ** 2 <= 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((g[y][x] === "." || y >= base) && inBody(x, y)) g[y][x] = inBody(x, y, 1) ? "s" : "d";   // from the chin down the body wins
    for (const side of ["L", "R"]) {
      const out = side === "L" ? -1 : 1, E = cx + out * bx(ay);   // the body's edge on the arm row
      put(g, ay, E, "s");   // the arm grows out of the body, no seam
      if (arms[side === "L" ? "left" : "right"]) {   // reaching out, hand at the end
        for (let i = 1; i <= 3; i++) { put(g, ay - 1, E + out * i, "d"); put(g, ay, E + out * i, "d"); }
        put(g, ay - 1, E + out * 4, "s"); put(g, ay, E + out * 4, "s");
        hand[side] = [ay, E + out * 4];
        if (side === "R") wrist.push([ay, E + 3], [ay - 1, E + 3]);
      } else {   // a stubby nub
        put(g, ay - 1, E + out, "d"); put(g, ay - 1, E + out * 2, "d");
        put(g, ay, E + out, "s"); put(g, ay, E + out * 2, "s"); put(g, ay, E + out * 3, "d");
        put(g, ay + 1, E + out, "d"); put(g, ay + 1, E + out * 2, "d");
        hand[side] = [ay, E + out * 3];
        if (side === "R") wrist.push([ay, E + 2], [ay - 1, E + 2]);
      }
    }
    const fo = Math.round(brx * 0.45);   // feet: two little ovals, a shade darker, poking out under the body
    for (const fx of [cx - fo - 2, cx + fo - 1]) { for (let i = 0; i < 4; i++) put(g, feetY, fx + i, "u"); put(g, feetY + 1, fx + 1, "u"); put(g, feetY + 1, fx + 2, "u"); }
  } else {   // a ghost keeps its little stub arms
    const gy = Math.round(cy + ry * 0.15);
    if (arms.right) { const x0 = Math.round(cx + rx); put(g, gy, x0, "d"); put(g, gy, x0 + 1, "d"); put(g, gy - 1, x0 + 2, "s"); put(g, gy, x0 + 2, "s"); hand.R = [gy, x0 + 2]; }
    if (arms.left) { const x0 = Math.round(cx - rx); put(g, gy, x0, "d"); put(g, gy, x0 - 1, "d"); put(g, gy - 1, x0 - 2, "s"); put(g, gy, x0 - 2, "s"); hand.L = [gy, x0 - 2]; }
  }
  if (scooter) {
    const deck = ghost ? base : feetY + 2, L = Math.round(cx - brx * 0.7), R = Math.round(cx + brx * 0.7);
    for (let x = L; x <= R; x++) { put(g, deck, x, "y"); put(g, deck + 1, x, "y"); }
    for (const X of [L + 1, R - 2]) { put(g, deck + 2, X, "k"); put(g, deck + 2, X + 1, "k"); put(g, deck + 3, X, "k"); put(g, deck + 3, X + 1, "k"); put(g, deck + 2, X + 1, "Y"); }
    const hb = ghost ? R + 3 : (hand.R ? hand.R[1] + 1 : Math.round(cx + brx) + 4), poleTop = ghost ? Math.round(cy - 1) : ay;
    for (let y = poleTop; y <= deck + 1; y++) put(g, y, hb, "y");
    put(g, poleTop - 1, hb - 1, "k"); put(g, poleTop - 1, hb, "k"); put(g, poleTop - 1, hb + 1, "k");
    put(g, deck + 2, hb, "k"); put(g, deck + 3, hb, "k"); put(g, deck + 3, hb - 1, "k"); put(g, deck + 3, hb + 1, "k");
  }
  if (ghost) {   // wavy hem, see-through look comes from CSS
    const by = Math.round(cy + ry);
    for (let x = 0; x < W; x++) { if (g[by][x] !== "." && x % 3 === 1) g[by][x] = "."; if (g[by - 1] && g[by - 1][x] === "d" && x % 3 === 1) g[by - 1][x] = "s"; }
  }
  // worn things
  for (const it of wear) {
    if (it.proc === "swap") for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (it.swap[g[y][x]]) g[y][x] = it.swap[g[y][x]];
    if (it.proc === "chain") {
      if (ghost) {
        const yy = my + 2;
        for (let x = eyes[0] - 1; x <= eyes[1] + 2; x++) if (g[yy][x] !== ".") put(g, yy, x, (x % 2) ? "g" : "G");
        put(g, yy + 1, mx - 1, "g"); put(g, yy + 1, mx + 1, "g"); put(g, yy + 1, mx, "w"); put(g, yy + 2, mx, "g"); put(g, yy + 3, mx, "w");
      } else {   // round the neck, pendant on the chest
        const yy = base + 1;
        for (let x = cx - bx(yy); x <= cx + bx(yy); x++) put(g, yy, x, (x % 2) ? "g" : "G");
        put(g, yy + 1, mx - 1, "g"); put(g, yy + 1, mx + 1, "g"); put(g, yy + 1, mx, "w"); put(g, yy + 2, mx, "g"); put(g, yy + 3, mx, "w");
      }
    }
    if (it.proc === "shades") { for (let x = eyes[0] - 1; x <= eyes[1] + 2; x++) { put(g, eyeY - 1, x, "k"); put(g, eyeY, x, "k"); put(pu, eyeY - 1, x, "."); put(pu, eyeY, x, "."); } put(g, eyeY - 1, eyes[0], "x"); put(g, eyeY - 1, eyes[1], "x"); }
    if (it.proc === "cartier") { for (const X of eyes) { put(g, eyeY - 2, X, "g"); put(g, eyeY - 2, X + 1, "g"); put(g, eyeY + 1, X, "g"); put(g, eyeY + 1, X + 1, "g"); put(g, eyeY - 1, X - 1, "g"); put(g, eyeY, X - 1, "g"); put(g, eyeY - 1, X + 2, "g"); put(g, eyeY, X + 2, "g"); } put(g, eyeY - 1, mx, "g"); }
    if (it.proc === "grill") for (let x = mx - 1; x <= mx + 1; x++) { put(g, my, x, "g"); if (face === "stuffed") put(g, my + 1, x, "g"); }
    if (it.proc === "belly") {   // the V, on the chest
      const by = ghost ? Math.round(cy + ry * 0.35) : bcy + 1;
      put(g, by - 1, mx - 2, "o"); put(g, by - 1, mx + 2, "o"); put(g, by, mx - 1, "o"); put(g, by, mx + 1, "o"); put(g, by + 1, mx, "o");
    }
    if (it.proc === "wrist") wrist.forEach(([y, x], i) => put(g, y, x, i ? "G" : "g"));
    if (it.proc === "lip") {   // hanging off the right corner of the mouth, sticking well out, lit
      put(g, my, mx + 2, "n"); put(g, my, mx + 3, "N"); put(g, my, mx + 4, "n"); put(g, my + 1, mx + 5, "n"); put(g, my + 1, mx + 6, "N");
      put(g, my + 1, mx + 7, "n"); put(g, my + 1, mx + 8, "o"); put(g, my + 1, mx + 9, "r");
      put(g, my - 1, mx + 9, "Y"); put(g, my - 2, mx + 10, "Y"); put(g, my - 4, mx + 10, "Y"); put(g, my - 5, mx + 9, "Y");
    }
    if (it.proc === "hat" && it.grid) stamp(g, it.grid, mx - Math.floor(it.grid[0].length / 2), topY - 2 - it.grid.length + 2);
  }
  if (o.flame) stamp(g, EXTRA.flame, mx - 3, topY - 2 - EXTRA.flame.length + 1);
  return { body: g.map((r) => r.join("")), pupils: pu.map((r) => r.join("")), w: W, h: H, hand };
}

export function drawEgg(steps, hatchAt) {
  const g = EXTRA.egg.map((r) => r.split(""));
  const f = steps / Math.max(1, hatchAt);
  if (f >= 0.4) { put(g, 5, 4, "k"); put(g, 6, 5, "k"); put(g, 7, 4, "k"); }
  if (f >= 0.8) { put(g, 3, 7, "k"); put(g, 4, 8, "k"); put(g, 5, 7, "k"); put(g, 8, 6, "k"); put(g, 9, 7, "k"); }
  return { body: g.map((r) => r.join("")), pupils: [], w: g[0].length, h: g.length };
}

function blank(W, H) { return Array.from({ length: H }, () => Array(W).fill(".")); }
function put(g, y, x, c) { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = c; }
function stamp(g, grid, x0, y0) { grid.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== ".") put(g, y0 + y, x0 + x, ch); })); }

// One CSS box-shadow per pixel: cheap, crisp, no canvas.
export function shadow(rows, s) {
  const out = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (PAL[ch]) out.push(`${x * s}px ${y * s}px 0 0 ${PAL[ch]}`); }));
  return out.join(",");
}
export function size(rows) { return [Math.max(0, ...rows.map((r) => r.length)), rows.length]; }
