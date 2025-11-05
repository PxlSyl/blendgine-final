import { AsciiCharsetPreset } from './type';

export const LIVING_LANGUAGES: AsciiCharsetPreset[] = [
  // Latin (English)
  {
    name: 'Latin (Full)',
    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    font: 'NotoSansMono',
  },
  {
    name: 'Latin Gradient',
    charset: 'MNHQ$OC?7>!:-;. ',
    font: 'NotoSansMono',
  },
  {
    name: 'Latin Minimal',
    charset: 'MNHQOC',
    font: 'NotoSansMono',
  },
  {
    name: 'Latin Blocky',
    charset: '█▓▒░MNHQOC',
    font: 'NotoSansMono',
  },
  {
    name: 'Latin Artistic',
    charset: 'MNHQOC@#*+=-:. ',
    font: 'NotoSansMono',
  },
  // Russian
  {
    name: 'Russian (Full)',
    charset: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя',
    font: 'NotoSansCyrillic',
  },
  {
    name: 'Russian Gradient',
    charset: 'ЯЮЭЫЪЩШЧЦХФУТСРПОНМЛКЙИЗЖЁЕДГВБА',
    font: 'NotoSansCyrillic',
  },
  {
    name: 'Russian Minimal',
    charset: 'ЯЮЭЫЪЩШЧЦХФУТСРПОНМЛК',
    font: 'NotoSansCyrillic',
  },
  {
    name: 'Russian Blocky',
    charset: '█▓▒░ЯЮЭЫЪЩШЧЦХФУТСРПОНМЛК',
    font: 'NotoSansCyrillic',
  },
  {
    name: 'Russian Artistic',
    charset: 'ЯЮЭЫЪЩШЧЦХФУТСРПОНМЛК@#*+=-:. ',
    font: 'NotoSansCyrillic',
  },
  // Greek
  {
    name: 'Greek (Full)',
    charset: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω',
    font: 'NotoSansMono',
  },
  {
    name: 'Greek Gradient',
    charset: 'ΩΨΧΦΥΤΣΡΠΟΞΝΜΛΚΙΘΗΖΕΔΓΒΑ',
    font: 'NotoSansMono',
  },
  {
    name: 'Greek Minimal',
    charset: 'ΩΨΧΦΥΤΣΡΠΟ',
    font: 'NotoSansMono',
  },
  {
    name: 'Greek Blocky',
    charset: '█▓▒░ΩΨΧΦΥΤΣΡΠΟ',
    font: 'NotoSansMono',
  },
  {
    name: 'Greek Artistic',
    charset: 'ΩΨΧΦΥΤΣΡΠΟ@#*+=-:. ',
    font: 'NotoSansMono',
  },
  // Arabic
  {
    name: 'Arabic (Full)',
    charset: 'ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوي',
    font: 'NotoSansArabic',
  },
  {
    name: 'Arabic Gradient',
    charset: 'يوهملقفغعظطضصشسزرذدخحجثتباء',
    font: 'NotoSansArabic',
  },
  {
    name: 'Arabic Minimal',
    charset: 'يوملفقغع',
    font: 'NotoSansArabic',
  },
  {
    name: 'Arabic Blocky',
    charset: '█▓▒░يوملفقغع',
    font: 'NotoSansArabic',
  },
  {
    name: 'Arabic Artistic',
    charset: 'يوملفقغع@#*+=-:. ',
    font: 'NotoSansArabic',
  },
  // Hebrew
  {
    name: 'Hebrew (Full)',
    charset: 'אבגדהוזחטיכלמנסעפצקרשת',
    font: 'NotoSansHebrew',
  },
  {
    name: 'Hebrew Gradient',
    charset: 'תשרקצפעסנמלכיטחזוהדגבא',
    font: 'NotoSansHebrew',
  },
  {
    name: 'Hebrew Minimal',
    charset: 'תשרקצפעסנ',
    font: 'NotoSansHebrew',
  },
  {
    name: 'Hebrew Blocky',
    charset: '█▓▒░תשרקצפעסנ',
    font: 'NotoSansHebrew',
  },
  {
    name: 'Hebrew Artistic',
    charset: 'תשרקצפעסנ@#*+=-:. ',
    font: 'NotoSansHebrew',
  },
  // Japanese (Hiragana)
  {
    name: 'Japanese (Full Hiragana)',
    charset:
      'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん',
    font: 'NotoSansJP',
  },
  {
    name: 'Japanese Gradient',
    charset: 'んをわらやまはなたさかあ',
    font: 'NotoSansJP',
  },
  {
    name: 'Japanese Minimal',
    charset: 'んわらやまはな',
    font: 'NotoSansJP',
  },
  {
    name: 'Japanese Blocky',
    charset: '█▓▒░んわらやまはな',
    font: 'NotoSansJP',
  },
  {
    name: 'Japanese Artistic',
    charset: 'んわらやまはな@#*+=-:. ',
    font: 'NotoSansJP',
  },

  // Thai (Full)
  {
    name: 'Thai (Full)',
    charset: 'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮะาิีึืุูเแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙',
    font: 'NotoSansThai',
  },
  {
    name: 'Thai Gradient',
    charset: 'กขฃคฆงจฉชซญฎฏฐฑฒณ',
    font: 'NotoSansThai',
  },
  {
    name: 'Thai Minimal',
    charset: 'กขงจ',
    font: 'NotoSansThai',
  },
  {
    name: 'Thai Blocky',
    charset: '█▓▒░กข',
    font: 'NotoSansThai',
  },
  {
    name: 'Thai Artistic',
    charset: 'กข@#*+=-:. ',
    font: 'NotoSansThai',
  },
  // Korean (Full Hangul Syllables - representative)
  {
    name: 'Korean (Full)',
    charset:
      '가각간갇갈감갑값갓갔강개객갠갤갬갭갯갰갱거걱건걷걸검겁것겄겅게겐겔겜겝겟겠겡겨격견결겸겹겻겼경고곡곤곧골곰곱곳공과곽관괄괌괍괏광괘괜괠괩괬괭괴괵굉교굔굘굡굣굥구국군굳굴굵굶굻굼굽굿궁궂궈궉권궐궜궝궤궷귀귁귄귈귐귑귓귔귕규균귤그극근귿글긁금급긋긍긔기긱긴길김깁깃깅까깍깎깐깔깜깝깟깠깡깨깩깬깰깸깹깻깼깽꺄꺅꺌꺼꺽꺾껀껄껌껍껏껐껑께껙껜껨껫껭껴껸껼꼇꼈꼍꼐꼬꼭꼰꼲꼴꼼꼽꼿꽁꽂꽃꽈꽉꽐꽜꽝꽤꽥꽹꾀꾄꾈꾐꾑꾕꾜꾸꾹꾼꿀꿈꿉꿋꿍꿎꿔꿜꿨꿩꿰꿱뀀뀁뀄뀈뀐뀔뀜뀝뀨끄끅끈끊끌끎끔끕끗끙끠끼끽낀낄낌낍낏낑나낙낚난날남납낫났낭내냄냅냇냈냉냐냑냥너넉넋넌널넓넘넙넛넜넝네넥넨넬넴넵넷넸넹녀녁년녈념녑녔녕노녹논놀놈놉놋농높놓놔놘놜놨뇌뇐뇔뇝뇨누눅눈눌눔눕눗눙눠눴눼뉘뉜뉠뉨뉩뉴뉵느늑는늘늙늚늠늡늦늪늬늰늴니닉닌닐님닙닛닝다닥닦단닫달닭담답닷당대댁댄댈댐댑댓댔댕댜더덕던덛덜덤덥덧덩데덱덴델뎀뎁뎃뎄뎅도독돈돌돔돕돗동돼됐되된될됨됩됫됬됭두둑둔둘둠둡둣둥둬뒀뒈뒤뒨뒬뒵뒷뒹듀듄듈듐듕드득든듣들듦듬듭듯등디딕딘딛딜딤딥딧딨딩따딱딴딸땀땁땃땅때땍땐땔땜땝땟땠땡떠떡떤떨떪떫떰떱떳떴떵떻떼떽뗀뗄뗌뗍뗏뗐다뗑또똑똔똘똥똬똴똸똹뙈뙤뙨뚜뚝뚠뚤뚬뚭뚯뚱뚸뚹뚼뚽뛔뛰뛴뛸뜀뜁뜅뜨뜩뜬뜯뜰뜸뜹뜻띄띈띌띔띕띠띤띨띰띱띳띵라락란랄람랍랏랐랑래랙랜랠램랩랫랬랭랴략량러럭런럴럼럽럿렀렁레렉렌렐렘렙렛렝려력련렬렴렵렷렸령례롄롑롓롔로록론롤롬롭롯롱롸롼뢍뢨뢰뢴뢸룀룁룅루룩룬룰룸룹룻룽뤄뤘뤠뤼뤽륀륄륌륏륑류륙륜률륨륩륫륭르륵른를름릅릇릉리릭린릴림립릿링마막만많말맑맒맘맙맛망맞맡맣매맥맨맬맴맵맷맸맹먀먁먈먕머먹먼멀멂멈멉멋멍메멕멘멜멤멥멧멩며멱면멸몃몄명몇모목몬몰몸몹못몽뫄뫈뫘뫙뫠뫼묀묄묍묏묑묘묜묠묩무묵문묻물묽묾묻뭄뭅뭇뭉뭐뭔뭘뭡뭣뭬뮈뮌뮐뮘뮙뮤뮨뮬뮴므믄믈믐믓믕미믹민믿밀밉밋밍',
    font: 'NotoSansKR',
  },
  {
    name: 'Korean Gradient',
    charset: '한글가나다라마바사아자차카타파하',
    font: 'NotoSansKR',
  },
  {
    name: 'Korean Minimal',
    charset: '가나마',
    font: 'NotoSansKR',
  },
  {
    name: 'Korean Blocky',
    charset: '█▓▒░가나',
    font: 'NotoSansKR',
  },
  {
    name: 'Korean Artistic',
    charset: '가나@#*+=-:. ',
    font: 'NotoSansKR',
  },
  // Chinese (Representative Hanzi)
  {
    name: 'Chinese (Full)',
    charset:
      '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习便响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严龙飞',
    font: 'NotoSansSC',
  },
  {
    name: 'Chinese Gradient',
    charset: '漢字的一是在不了有和人',
    font: 'NotoSansSC',
  },
  {
    name: 'Chinese Minimal',
    charset: '一二三',
    font: 'NotoSansSC',
  },
  {
    name: 'Chinese Blocky',
    charset: '█▓▒░一二',
    font: 'NotoSansSC',
  },
  {
    name: 'Chinese Artistic',
    charset: '一二@#*+=-:. ',
    font: 'NotoSansSC',
  },
  // Devanagari (Full)
  {
    name: 'Devanagari (Full)',
    charset: 'अआइईउऊऋॠऌॡएऐओऔअंअःकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह़ऽािीुूृॄॢॣेैोौंः्',
    font: 'NotoSansDevanagari',
  },
  {
    name: 'Devanagari Gradient',
    charset: 'कखगघङचछजझञ',
    font: 'NotoSansDevanagari',
  },
  {
    name: 'Devanagari Minimal',
    charset: 'कगन',
    font: 'NotoSansDevanagari',
  },
  {
    name: 'Devanagari Blocky',
    charset: '█▓▒░कग',
    font: 'NotoSansDevanagari',
  },
  {
    name: 'Devanagari Artistic',
    charset: 'कग@#*+=-:. ',
    font: 'NotoSansDevanagari',
  },
  // Tamil (Full)
  {
    name: 'Tamil (Full)',
    charset: 'அஆஇஈஉஊஎஏஐஒஓஔஃகஙசஜஞடணதநபமயரலவழளறனாிீுூெேைொோௌ்',
    font: 'NotoSansTamil',
  },
  {
    name: 'Tamil Gradient',
    charset: 'அஆஇஈஉஊஎஏஐஒ',
    font: 'NotoSansTamil',
  },
  {
    name: 'Tamil Minimal',
    charset: 'அஇஉ',
    font: 'NotoSansTamil',
  },
  {
    name: 'Tamil Blocky',
    charset: '█▓▒░அஇ',
    font: 'NotoSansTamil',
  },
  {
    name: 'Tamil Artistic',
    charset: 'அஇ@#*+=-:. ',
    font: 'NotoSansTamil',
  },
  // Bengali (Full)
  {
    name: 'Bengali (Full)',
    charset: 'অআইঈউঊঋৠঌৡএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ়ঽািীুূৃৄৢৣেৈোৌংঃ্',
    font: 'NotoSansBengali',
  },
  {
    name: 'Bengali Gradient',
    charset: 'অআইঈউঊঋএঐও',
    font: 'NotoSansBengali',
  },
  {
    name: 'Bengali Minimal',
    charset: 'অইউ',
    font: 'NotoSansBengali',
  },
  {
    name: 'Bengali Blocky',
    charset: '█▓▒░অই',
    font: 'NotoSansBengali',
  },
  {
    name: 'Bengali Artistic',
    charset: 'অই@#*+=-:. ',
    font: 'NotoSansBengali',
  },
  // Telugu (Full)
  {
    name: 'Telugu (Full)',
    charset: 'అఆఇఈఉఊఋౠఌౡఎఏఐఒఓఔకఖగఘఙచఛజఝఞటఠడఢణతథదధనపఫబభమయరలవశషసహ఼ఽాిీుూృౄౢౣెేైొోౌ్',
    font: 'NotoSansTelugu',
  },
  {
    name: 'Telugu Gradient',
    charset: 'అఆఇఈఉఊఋఎఏఐఒ',
    font: 'NotoSansTelugu',
  },
  {
    name: 'Telugu Minimal',
    charset: 'అఇఉ',
    font: 'NotoSansTelugu',
  },
  {
    name: 'Telugu Blocky',
    charset: '█▓▒░అఇ',
    font: 'NotoSansTelugu',
  },
  {
    name: 'Telugu Artistic',
    charset: 'అఇ@#*+=-:. ',
    font: 'NotoSansTelugu',
  },
  // Kannada (Full)
  {
    name: 'Kannada (Full)',
    charset: 'ಅಆಇಈಉಊಋೠಌೡಎಏಐಒಓಔಕಖಗಘಙಚಛಜಝಞಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹ಼ಽಾಿೀುೂೃೄೢೣೆೇೈೊೋೌ್',
    font: 'NotoSansKannada',
  },
  {
    name: 'Kannada Gradient',
    charset: 'ಅಆಇಈಉಊಋಎಏಐಒ',
    font: 'NotoSansKannada',
  },
  {
    name: 'Kannada Minimal',
    charset: 'ಅಇಉ',
    font: 'NotoSansKannada',
  },
  {
    name: 'Kannada Blocky',
    charset: '█▓▒░ಅಇ',
    font: 'NotoSansKannada',
  },
  {
    name: 'Kannada Artistic',
    charset: 'ಅಇ@#*+=-:. ',
    font: 'NotoSansKannada',
  },
  // Malayalam (Full)
  {
    name: 'Malayalam (Full)',
    charset: 'അആഇഈഉഊഋൠഌൡഎഏഐഒഓഔകഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹ഼ഽാിീുൂൃൄൢൣെേൈൊോൌ്',
    font: 'NotoSansMalayalam',
  },
  {
    name: 'Malayalam Gradient',
    charset: 'അആഇഈഉഊഋഎഏഐഒ',
    font: 'NotoSansMalayalam',
  },
  {
    name: 'Malayalam Minimal',
    charset: 'അഇഉ',
    font: 'NotoSansMalayalam',
  },
  {
    name: 'Malayalam Blocky',
    charset: '█▓▒░അഇ',
    font: 'NotoSansMalayalam',
  },
  {
    name: 'Malayalam Artistic',
    charset: 'അഇ@#*+=-:. ',
    font: 'NotoSansMalayalam',
  },
  // Gujarati (Full)
  {
    name: 'Gujarati (Full)',
    charset: 'અઆઇઈઉઊઋૠઌૡએઐઓઔકખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહ઼ઽાિીુૂૃૄૢૣેૈોૌંઃ્',
    font: 'NotoSansGujarati',
  },
  {
    name: 'Gujarati Gradient',
    charset: 'અઆઇઈઉઊઋએઐઓ',
    font: 'NotoSansGujarati',
  },
  {
    name: 'Gujarati Minimal',
    charset: 'અઇઉ',
    font: 'NotoSansGujarati',
  },
  {
    name: 'Gujarati Blocky',
    charset: '█▓▒░અઇ',
    font: 'NotoSansGujarati',
  },
  {
    name: 'Gujarati Artistic',
    charset: 'અઇ@#*+=-:. ',
    font: 'NotoSansGujarati',
  },
  // Gurmukhi (Full)
  {
    name: 'Gurmukhi (Full)',
    charset: 'ਅਆਇਈਉਊਏਐਓਔਕਖਗਘਙਚਛਜਝਞਟਠਡਢਣਤਥਦਧਨਪਫਬਭਮਯਰਲਵਸ਼਷ਸਹ਼਽ਾਿੀੁੂੇੈੋੌੰਃ੍',
    font: 'NotoSansGurmukhi',
  },
  {
    name: 'Gurmukhi Gradient',
    charset: 'ਅਆਇਈਉਊਏਐਓਔ',
    font: 'NotoSansGurmukhi',
  },
  {
    name: 'Gurmukhi Minimal',
    charset: 'ਅਇਉ',
    font: 'NotoSansGurmukhi',
  },
  {
    name: 'Gurmukhi Blocky',
    charset: '█▓▒░ਅਇ',
    font: 'NotoSansGurmukhi',
  },
  {
    name: 'Gurmukhi Artistic',
    charset: 'ਅਇ@#*+=-:. ',
    font: 'NotoSansGurmukhi',
  },
  // Oriya (Full)
  {
    name: 'Oriya (Full)',
    charset: 'ଅଆଇଈଉଊଋୠଌୡଏଐଓଔକଖଗଘଙଚଛଜଝଞଟଠଡଢଣତଥଦଧନପଫବଭମଯରଲଵଶଷସହ଼ଽାିୀୁୂୃୄୢୣେୈୋୌଂଃ୍',
    font: 'NotoSansOriya',
  },
  {
    name: 'Oriya Gradient',
    charset: 'ଅଆଇଈଉଊଋଏଐଓ',
    font: 'NotoSansOriya',
  },
  {
    name: 'Oriya Minimal',
    charset: 'ଅଇଉ',
    font: 'NotoSansOriya',
  },
  {
    name: 'Oriya Blocky',
    charset: '█▓▒░ଅଇ',
    font: 'NotoSansOriya',
  },
  {
    name: 'Oriya Artistic',
    charset: 'ଅଇ@#*+=-:. ',
    font: 'NotoSansOriya',
  },
  // Sinhala (Full)
  {
    name: 'Sinhala (Full)',
    charset: 'අආඇඈඉඊඋඌඍඎඏඐඑඒඓඔඕඖකඛගඝඞචඡජඣඤටඨඩඪණතථදධනපඵබභමයරලවශෂසහෆඨඬඳඵ඼඾඿ාිීුූෘෙේෛොෝෞ්',
    font: 'NotoSansSinhala',
  },
  {
    name: 'Sinhala Gradient',
    charset: 'අආඇඈඉඊඋඌඍ',
    font: 'NotoSansSinhala',
  },
  {
    name: 'Sinhala Minimal',
    charset: 'අඉඋ',
    font: 'NotoSansSinhala',
  },
  {
    name: 'Sinhala Blocky',
    charset: '█▓▒░අඉ',
    font: 'NotoSansSinhala',
  },
  {
    name: 'Sinhala Artistic',
    charset: 'අඉ@#*+=-:. ',
    font: 'NotoSansSinhala',
  },
  // Tibetan (Full)
  {
    name: 'Tibetan (Full)',
    charset:
      'ཀཁགངཅཆཇཉཏཐདནཔཕབམཙཚཛཝཞཟའཡརལཤསཧཨཀྵཪཫཬ཭཮཯཰ཱཱཱིིུུྲྀཷླྀཹེཻོཽཾཿ྄ཱྀྀྂྃ྅྆྇ྈྉྊྋྌྍྎྏྐྑྒྒྷྔྕྖྗྙྚྛྜྜྷྞྟྠྡྡྷྣྤྥྦྦྷྨྩྪྫྫྷྭྮྯྰྱྲླྴྵྶྷྸྐྵྺྻྼ྽྾྿',
    font: 'NotoSansTibetan',
  },
  {
    name: 'Tibetan Gradient',
    charset: 'ཀཁགངཅཆཇཉཏཐད',
    font: 'NotoSansTibetan',
  },
  {
    name: 'Tibetan Minimal',
    charset: 'ཀགཏ',
    font: 'NotoSansTibetan',
  },
  {
    name: 'Tibetan Blocky',
    charset: '█▓▒░ཀག',
    font: 'NotoSansTibetan',
  },
  {
    name: 'Tibetan Artistic',
    charset: 'ཀག@#*+=-:. ',
    font: 'NotoSansTibetan',
  },
  // Mongolian (Full)
  {
    name: 'Mongolian (Full)',
    charset: 'ᠠᠡᠢᠣᠤᠥᠦᠧᠨᠩᠪᠫᠮᠯᠰᠱᠲᠳᠴᠵᠶᠷᠸᠹᠺᠻᠼᠽᠾᠿ',
    font: 'NotoSansMongolian',
  },
  {
    name: 'Mongolian Gradient',
    charset: 'ᠠᠡᠢᠣᠤᠥᠦᠧᠨᠩᠪᠫ',
    font: 'NotoSansMongolian',
  },
  {
    name: 'Mongolian Minimal',
    charset: 'ᠠᠢᠨᠮᠯ',
    font: 'NotoSansMongolian',
  },
  {
    name: 'Mongolian Blocky',
    charset: '█▓▒░ᠠᠢᠨ',
    font: 'NotoSansMongolian',
  },
  {
    name: 'Mongolian Artistic',
    charset: 'ᠠᠢᠨ@#*+=-:. ',
    font: 'NotoSansMongolian',
  },
  // Ethiopic (Full)
  {
    name: 'Ethiopic (Full)',
    charset:
      'ሀሁሂሃሄህሆለሉሊላሌልሎሏሐሑሒሓሔሕሖሗመሙሚማሜምሞሟሠሡሢሣሤሥሦሧረሩሪራሬርሮሯሰሱሲሳሴስሶሷሸሹሺሻሼሽሾሿቀቁቂቃቄቅቆቇቈ቉ቊቋቌቍቐቑቒቓቔቕቖ቗ቘ቙ቚቛቜቝበቡቢባቤብቦቧቨቩቪቫቬቭቮቯተቱቲታቴትቶቷቸቹቺቻቼችቾቿኀኁኂኃኄኅኆኇኈ኉ኊኋኌኍነኑኒናኔንኖኗኘኙኚኛኜኝኞኟአኡኢኣኤእኦኧከኩኪካኬክኮኯኰ኱ኲኳኴኵኸኹኺኻኼኽኾዀ዁ዂዃዄዅወዉዊዋዌውዎዏዐዑዒዓዔዕዖዘዙዚዛዜዝዞዟዠዡዢዣዤዥዦዧየዩዪያዬይዮዯደዱዲዳዴድዶዷጀጁጂጃጄጅጆጇገጉጊጋጌግጎጏጐ጑ጒጓጔጕጘጙጚጛጜጝጞጟጠጡጢጣጤጥጦጧጨጩጪጫጬጭጮጯጰጱጲጳጴጵጶጷጸጹጺጻጼጽጾጿፀፁፂፃፄፅፆፇፈፉፊፋፌፍፎፏፐፑፒፓፔፕፖፗ',
    font: 'NotoSansEthiopic',
  },
  {
    name: 'Ethiopic Gradient',
    charset: 'ሀለመሠረሰሸቀበቨተቸኀነኘአከወዐዘየደጀገጠጨጰጸፀፈፐ',
    font: 'NotoSansEthiopic',
  },
  {
    name: 'Ethiopic Minimal',
    charset: 'ሀመረሰበነአወገፐ',
    font: 'NotoSansEthiopic',
  },
  {
    name: 'Ethiopic Blocky',
    charset: '█▓▒░ሀመረ',
    font: 'NotoSansEthiopic',
  },
  {
    name: 'Ethiopic Artistic',
    charset: 'ሀመረ@#*+=-:. ',
    font: 'NotoSansEthiopic',
  },
  // Armenian (Full)
  {
    name: 'Armenian (Full)',
    charset: 'ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖաբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆ',
    font: 'NotoSansArmenian',
  },
  {
    name: 'Armenian Gradient',
    charset: 'ՖՕՔՓՒՑՐՏՎՍՌՋՊՉՇՆՅՄՃՂՁՀԿԾԽԼԻԺԹԸԷԶԵԴԳԲԱ',
    font: 'NotoSansArmenian',
  },
  {
    name: 'Armenian Minimal',
    charset: 'ԱԲԳԴԵՖ',
    font: 'NotoSansArmenian',
  },
  {
    name: 'Armenian Blocky',
    charset: '█▓▒░ԱԲԳ',
    font: 'NotoSansArmenian',
  },
  {
    name: 'Armenian Artistic',
    charset: 'ԱԲԳ@#*+=-:. ',
    font: 'NotoSansArmenian',
  },
  // Georgian (Full)
  {
    name: 'Georgian (Full)',
    charset: 'აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ',
    font: 'NotoSansGeorgian',
  },
  {
    name: 'Georgian Gradient',
    charset: 'ჰჯხჭწძცჩშყღქფტსრჟპონმლკიეძდგბა',
    font: 'NotoSansGeorgian',
  },
  {
    name: 'Georgian Minimal',
    charset: 'აბგდევზ',
    font: 'NotoSansGeorgian',
  },
  {
    name: 'Georgian Blocky',
    charset: '█▓▒░აბგ',
    font: 'NotoSansGeorgian',
  },
  {
    name: 'Georgian Artistic',
    charset: 'აბგ@#*+=-:. ',
    font: 'NotoSansGeorgian',
  },
  // Khmer (Full)
  {
    name: 'Khmer (Full)',
    charset: 'កខគឃងចឆជឈញដឋឌឍណតថទធនបផពភមយរលវឝឞសហឡអឣឤឥឦឧឨឩឪឫឬឭឮឯឰឱឲឳ',
    font: 'NotoSansKhmer',
  },
  {
    name: 'Khmer Gradient',
    charset: 'អឣឤឥឦឧឨឩឪឫឬ',
    font: 'NotoSansKhmer',
  },
  {
    name: 'Khmer Minimal',
    charset: 'កខគង',
    font: 'NotoSansKhmer',
  },
  {
    name: 'Khmer Blocky',
    charset: '█▓▒░កខ',
    font: 'NotoSansKhmer',
  },
  {
    name: 'Khmer Artistic',
    charset: 'កខ@#*+=-:. ',
    font: 'NotoSansKhmer',
  },
  // Lao (Full)
  {
    name: 'Lao (Full)',
    charset: 'ກຂຄງຈຊຍດຕຖທນບປຜຝພຟມຍລວສຫອຮຯະັຳິີຶືຸູົຼຽເແໂໃໄໆ່້໊໋໌ໍ',
    font: 'NotoSansLao',
  },
  {
    name: 'Lao Gradient',
    charset: 'ຮຯະັຳິີຶືຸູ',
    font: 'NotoSansLao',
  },
  {
    name: 'Lao Minimal',
    charset: 'ກຂຄ',
    font: 'NotoSansLao',
  },
  {
    name: 'Lao Blocky',
    charset: '█▓▒░ກຂ',
    font: 'NotoSansLao',
  },
  {
    name: 'Lao Artistic',
    charset: 'ກຂ@#*+=-:. ',
    font: 'NotoSansLao',
  },
  // Myanmar (Full)
  {
    name: 'Myanmar (Full)',
    charset:
      'က ခ ဂ ဃ င စ ဆ ဇ ဈ ဉ ည ဋ ဌ ဍ ဎ ဏ တ ထ ဒ ဓ န ပ ဖ ဗ ဘ မ ယ ရ လ ဝ သ ဟ ဠ အ ဢ ဣ ဤ ဥ ဦ ဧ ဨ ဩ ဪ ါ ာ ိ ီ ု ူ ေ ဲ ဳ ဴ ဵ ံ ့ း ္ ် ျ ြ ွ ှ ဿ ',
    font: 'NotoSansMyanmar',
  },
  {
    name: 'Myanmar Gradient',
    charset: 'ဿ ှ ွ ြ ျ ် ္ း ့ ံ',
    font: 'NotoSansMyanmar',
  },
  {
    name: 'Myanmar Minimal',
    charset: 'ကခဂင',
    font: 'NotoSansMyanmar',
  },
  {
    name: 'Myanmar Blocky',
    charset: '█▓▒░ကခ',
    font: 'NotoSansMyanmar',
  },
  {
    name: 'Myanmar Artistic',
    charset: 'ကခ@#*+=-:. ',
    font: 'NotoSansMyanmar',
  },
];
