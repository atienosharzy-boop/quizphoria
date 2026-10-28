// [grade, question, options, index of correct option]
const Q={
 math:[[1,'🍎🍎🍎 + 🍎🍎 = ?',['4','5','6'],1],[1,'Which number is bigger: 7 or 4?',['7','4','Same'],0],[1,'What number comes after 9?',['8','10','11'],1],
  [2,'12 + 7 = ?',['18','19','20'],1],[2,'25 − 10 = ?',['15','35','14'],0],[2,'Count in 2s: 2, 4, 6, __',['7','8','9'],1],
  [3,'6 × 3 = ?',['12','18','21'],1],[3,'100 − 40 = ?',['60','50','70'],0],[3,'Half of 20 is?',['5','15','10'],2]],
 eng:[[1,'Which word starts with the letter b?',['ball','cat','sun'],0],[1,'I ___ a boy.',['is','am','are'],1],[1,'One cat, two ___',['cat','cats','cates'],1],
  [2,'She ___ to school.',['go','goes','going'],1],[2,'The opposite of big is?',['small','tall','long'],0],[2,'Which one is a place?',['run','blue','market'],2],
  [3,'Yesterday I ___ to the shop.',['walk','walked','walking'],1],[3,'Which word is a noun?',['table','run','quickly'],0],[3,'The plural of child is?',['childs','children','childes'],1]],
 kis:[[1,'Hujambo? Jibu ni:',['Sijambo','Kesho','Maji'],0],[1,'Jani lina rangi gani?',['Nyekundu','Kijani','Nyeusi'],1],[1,'Baba na mama ni:',['Wazazi','Walimu','Wageni'],0],
  [2,'Moja, mbili, ___',['nne','tatu','sita'],1],[2,'Siku baada ya Jumatatu ni:',['Jumanne','Jumapili','Ijumaa'],0],[2,'Wingi wa kitabu ni:',['kitabu','vitabu','mitabu'],1],
  [3,'Wingi wa mtoto ni:',['mtoto','vitoto','watoto'],2],[3,'Kinyume cha kubwa ni:',['ndogo','refu','pana'],0],[3,'Chakula kinachotengenezwa kwa unga wa mahindi:',['Ugali','Chai','Embe'],0]],
 env:[[1,'What gives us light in the day?',['Moon','Sun','Stars'],1],[1,'Which one is a pet?',['Lion','Dog','Elephant'],1],[1,'We drink clean ___',['water','soil','sand'],0],
  [2,'Plants need water and ___ to grow.',['sunlight','plastic','salt'],0],[2,'Which is a domestic animal?',['Cow','Zebra','Giraffe'],0],[2,'Before eating we wash our hands with soap and ___',['sand','water','oil'],1],
  [3,'Which is a source of water?',['River','Road','Roof tile'],0],[3,'Where do fish live?',['In water','In trees','Underground'],0],[3,'Cutting trees without planting new ones causes:',['Soil erosion','More rain','Clean air'],0]]
};
// ---- MORE QUESTIONS (Grades 1 to 5). Add new lines here: [grade, question, [options], index of correct option] ----
const MORE={
 math:[
  [1,'3 + 4 = ?',['6','7','8'],1],[1,'Which shape has 3 sides?',['Circle','Triangle','Square'],1],[1,'10 − 5 = ?',['4','5','6'],1],
  [2,'How many tens are in 30?',['2','3','4'],1],[2,'8 + 8 = ?',['14','16','18'],1],[2,'Which is the biggest number?',['45','54','39'],1],
  [3,'7 × 2 = ?',['12','14','16'],1],[3,'24 sweets are shared equally by 4 children. How many each?',['5','6','8'],1],[3,'Which is the biggest number?',['305','350','530'],2],
  [4,'8 × 7 = ?',['54','56','64'],1],[4,'1000 − 250 = ?',['650','750','850'],1],[4,'Which fraction equals one half?',['2/4','1/3','3/4'],0],
  [4,'The perimeter of a square with sides of 5 cm is?',['10 cm','20 cm','25 cm'],1],[4,'144 ÷ 12 = ?',['10','12','14'],1],[4,'Round 467 to the nearest ten.',['460','470','500'],1],
  [5,'15 × 12 = ?',['170','180','190'],1],[5,'Which is the same as 0.5?',['1/2','1/5','2/5'],0],[5,'The area of a rectangle 8 cm by 5 cm is?',['13 cm²','40 cm²','26 cm²'],1],
  [5,'25% of 200 is?',['25','50','75'],1],[5,'The next prime number after 7 is?',['9','11','13'],1],[5,'3/4 + 1/4 = ?',['1','4/8','3/16'],0]],
 eng:[
  [1,'Which word rhymes with cat?',['hat','dog','cup'],0],[1,'The opposite of hot is?',['cold','warm','big'],0],[1,'Which word is a colour?',['red','run','table'],0],
  [2,'Which sentence is correct?',['He are tall.','He is tall.','He am tall.'],1],[2,'The plural of box is?',['boxs','boxes','boxies'],1],[2,'A baby cow is called a?',['calf','kid','puppy'],0],
  [3,'Which word is a verb?',['jump','happy','book'],0],[3,'They ___ playing football.',['is','are','am'],1],[3,'A sentence starts with a ___ letter.',['capital','small','curly'],0],
  [4,'Choose the adjective: The tall girl sang.',['tall','girl','sang'],0],[4,'Which word is spelt correctly?',['beautifull','beautiful','beutiful'],1],[4,'The past tense of buy is?',['buyed','bought','buys'],1],
  [4,'She runs ___ than me.',['fast','faster','fastest'],1],[4,'Which word means the same as happy?',['sad','glad','angry'],1],[4,'How many words are in: I have a pen?',['3','4','5'],1],
  [5,'Which word is an adverb? He ran quickly.',['He','ran','quickly'],2],[5,'Neither of them ___ late.',['was','were','are'],0],[5,'The plural of mouse is?',['mouses','mice','mices'],1],
  [5,'Which word means the same as begin?',['start','end','stop'],0],[5,'Which one is a simile?',['As brave as a lion','The sun is hot','He ran home'],0],[5,'Which punctuation mark ends a question?',['.','?','!'],1]],
 kis:[
  [1,'Shule ni mahali pa:',['kusoma','kulala','kuogelea'],0],[1,'Kuku hutaga:',['mayai','maziwa','mkate'],0],[1,'Rangi ya damu ni:',['nyekundu','kijani','buluu'],0],
  [2,'Tano + tano ni:',['sita','nane','kumi'],2],[2,'Mwalimu hufanya nini?',['Hufundisha','Hulima','Huogelea'],0],[2,'Jumatatu, Jumanne, ___',['Jumatano','Jumamosi','Jumapili'],0],
  [3,'Kinyume cha mrefu ni:',['mfupi','mzuri','mkubwa'],0],[3,'Wingi wa mti ni:',['miti','viti','mitu'],0],[3,'Mama anapika ___.',['chakula','kiti','kalamu'],0],
  [4,'Kitenzi katika sentensi Juma anacheza mpira ni:',['Juma','anacheza','mpira'],1],[4,'Kinyume cha juu ni:',['chini','kando','mbele'],0],[4,'Methali: Haraka haraka haina ___',['baraka','pesa','mwisho'],0],
  [4,'Kinyume cha mbali ni:',['karibu','juu','chini'],0],[4,'Jina la mtu, mahali au kitu huitwa:',['nomino','kitenzi','kivumishi'],0],[4,'Wingi wa kiti ni:',['viti','miti','kiti'],0],
  [5,'Kivumishi katika kitabu kizuri ni:',['kitabu','kizuri','hakuna'],1],[5,'Methali: Mwenda pole ___',['hajikwai','hukimbia','hulala'],0],[5,'Wakati uliopita wa nasoma ni:',['nilisoma','nitasoma','ninasoma'],0],
  [5,'Kinyume cha furaha ni:',['huzuni','upendo','nguvu'],0],[5,'Alikula ni wakati gani?',['uliopita','uliopo','ujao'],0],[5,'Nomino ni neno linalotaja:',['jina la kitu','kitendo','sifa'],0]],
 env:[
  [1,'What do we use to see?',['Eyes','Ears','Nose'],0],[1,'Which one is a fruit?',['Mango','Chair','Stone'],0],[1,'What do we use to brush our teeth?',['Toothbrush','Broom','Spoon'],0],
  [2,'Which animal gives us milk?',['Cow','Hen','Fish'],0],[2,'Which is a living thing?',['Tree','Stone','Table'],0],[2,'Where does a bird lay eggs?',['Nest','Pond','Cave'],0],
  [3,'Which food gives us energy?',['Ugali','Soap','Plastic'],0],[3,'Which part of a plant takes in water?',['Roots','Flower','Fruit'],0],[3,'We keep our environment clean by:',['Putting rubbish in a bin','Burning plastic','Throwing litter'],0],
  [4,'Plants make their food in the:',['leaves','roots','stem'],0],[4,'Which one is a solid?',['Water','Stone','Air'],1],[4,'Which gas do we breathe in to stay alive?',['Oxygen','Carbon dioxide','Smoke'],0],
  [4,'Which organ do we use to smell?',['Nose','Skin','Tongue'],0],[4,'Which is a source of light?',['Sun','Moon','Mirror'],0],[4,'The longest river in Africa is the?',['Nile','Tana','Congo'],0],
  [5,'Water changes to vapour by:',['evaporation','freezing','melting'],0],[5,'Which is a renewable source of energy?',['Solar','Coal','Petrol'],0],[5,'Plants lose water through leaves by:',['transpiration','digestion','erosion'],0],
  [5,'Which organ pumps blood in the body?',['Heart','Lungs','Stomach'],0],[5,'Which one is a mammal?',['Whale','Shark','Frog'],0],[5,'Which planet is closest to the Sun?',['Mercury','Venus','Earth'],0]]
};
for(const k in MORE)Q[k].push(...MORE[k]);
