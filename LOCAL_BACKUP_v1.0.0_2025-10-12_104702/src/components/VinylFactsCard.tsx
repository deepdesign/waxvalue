'use client'

import { useState, useEffect } from 'react'

const ALL_VINYL_FACTS = [
  "The Beatles' infamous \"Yesterday and Today\" butcher cover, featuring the band in blood-stained butcher smocks surrounded by decapitated dolls and raw meat, was recalled and replaced. Original uncensored copies now sell for up to $125,000, making it one of the most valuable records ever sold at auction.",
  "Vinyl has experienced an extraordinary renaissance with 17 consecutive years of growth. In 2022 alone, over 40 million vinyl units were sold globally, and the format actually outsold CDs for the first time since 1987, marking an unprecedented comeback in music history.",
  "The rarest vinyl record is widely considered to be The Quarrymen's acetate of \"That'll Be the Day\" - before they became The Beatles. With only an estimated 50 copies in existence, each is valued at over $250,000, making them some of the most sought-after records in the world.",
  "If you were to carefully unwind the spiral groove on a standard 12\" vinyl record, you'd have a continuous line stretching approximately 1,500 feet long. This microscopic groove carries all the audio information for both sides of the album, an engineering marvel of analog technology.",
  "Modern vinyl pressing plants have become remarkably efficient, with each press capable of producing around 1,000 records per day. Despite this industrial scale, the basic pressing technique hasn't changed much since the 1940s, with heated vinyl pellets being pressed between metal stampers.",
  "Picture disc vinyl records - those with images printed directly onto the disc - command premium prices among collectors, often selling for 300-500% more than standard black vinyl pressings. Their visual appeal and limited production runs make them highly collectible, though purists argue the sound quality isn't quite as good.",
  "A standard 12\" LP spinning at 33⅓ revolutions per minute can hold approximately 22 minutes of music per side. This duration was specifically chosen by Columbia Records to allow Beethoven's 9th Symphony to fit on a single disc without interruption, revolutionizing classical music listening.",
  "The global vinyl market has exploded from $1.2 billion in 2022 and is projected to reach an impressive $2.8 billion by 2030. This growth has sparked a vinyl pressing plant boom, with new facilities opening worldwide to meet collector demand and creating thousands of manufacturing jobs.",
  "Approximately 1 in 4 serious record collectors owns more than 500 records in their personal collection. The average serious collector's library is valued between $3,000 and $5,000, though many collections are worth significantly more, especially those containing rare pressings and first editions.",
  "Rare first-press vinyl albums from the 1960s and 1970s, particularly from legendary labels like Blue Note, Motown, and Beatles releases, have shown appreciation rates of 8-12% annually. This makes vintage vinyl not just a hobby but potentially a viable alternative investment class for collectors.",
  "Black isn't vinyl's natural color at all - polyvinyl chloride (PVC) is actually nearly colorless with a milky, translucent appearance. The iconic black color comes from adding carbon-based pigments during manufacturing, which early producers believed improved both sound quality and the record's durability over time.",
  "The word 'vinyl' has an unexpected connection to wine. German chemist Hermann Kolbe coined the term in 1851, deriving it from the Latin word 'vinum' meaning wine, because vinyl's chemical structure is similar to ethylene, which when mixed with water produces ethyl alcohol - the same alcohol found in wine.",
  "During playback, the tiny contact point where the stylus touches the record groove can reach scorching temperatures of 230-250°F (over 100°C). However, because the stylus moves so incredibly fast through the groove, this heat doesn't have time to cause significant damage to the vinyl surface.",
  "Wu-Tang Clan's \"Once Upon a Time in Shaolin\" sold for an astounding $2 million in 2015, making it the most expensive single record ever sold. Only one copy exists in the world, and the buyer (later revealed to be Martin Shkreli) was contractually forbidden from releasing the music publicly for 88 years.",
  "The RIAA equalization curve is used on all vinyl records - bass frequencies are reduced by about 20dB and treble is boosted by 20dB during the cutting process. Your phono preamp then reverses this, reducing noise and allowing longer playing times by preventing the groove from becoming too wide for low bass notes.",
  "Colored and transparent vinyl records tend to wear out faster than traditional black vinyl due to manufacturing techniques and materials. The carbon additives in black vinyl actually provide structural reinforcement and improved durability, which is why audiophile pressings often stick with classic black.",
  "The 33⅓ RPM speed wasn't chosen arbitrarily - it was specifically selected because it allowed entire long-form classical pieces, like complete symphonies, to play uninterrupted on a single disc. This revolutionary format replaced the old 78 RPM shellac records that required changing discs every 3-4 minutes.",
  "Vinyl records are made from polyvinyl chloride (PVC), which consists of 57% chlorine (derived from salt) and 43% carbon derived from crude oil. This inexpensive material composition is one reason vinyl became the dominant physical music format and remains economically viable to produce even today.",
  "The most valuable vinyl genres for collectors are 1950s jazz records (especially Blue Note pressings), original Beatles and classic rock pressings from the 1960s-70s, and limited-run hip-hop releases. First pressings from these genres regularly sell for thousands of dollars, with some reaching six-figure prices at auction.",
  "Proper vinyl storage conditions are crucial for preservation - the ideal environment maintains a temperature of 65-70°F (18-21°C) and relative humidity of 45-50%. Records should be stored vertically, never stacked horizontally, and away from direct sunlight to prevent warping and degradation of the vinyl over decades.",
  "The first long-playing vinyl record was introduced by Columbia Records in 1948, revolutionizing the music industry by replacing fragile shellac 78 RPM records. This microgroove technology could hold 21-25 minutes per side compared to just 3-5 minutes on 78s, completely transforming how people experienced recorded music.",
  "Standard vinyl records weigh between 120-180 grams, with 180-gram pressings marketed as premium \"audiophile quality.\" The extra weight provides a more stable platform for the stylus, potentially reducing vibration and improving sound quality, though debates continue in the audiophile community about whether the difference is truly audible.",
  "The RIAA equalization curve, standardized in 1954, is still used on absolutely every vinyl record manufactured today. This pre-emphasis and de-emphasis curve allows for longer playing times and reduced surface noise, and remains one of the longest-running technical standards in consumer electronics history.",
  "When properly stored in controlled conditions, vinyl records can last 100+ years without significant degradation, far outlasting CDs which typically degrade after 20-50 years due to disc rot. Some of the earliest vinyl pressings from the 1950s still play beautifully today, a testament to the format's longevity.",
  "AC/DC's \"Back in Black\" is legendary as one of the loudest records ever pressed. The extremely hot mastering level - pushing the groove modulation to its absolute physical limits - caused the cutting lathes to frequently break down during production, but resulted in a record that absolutely explodes out of speakers with raw power.",
  "Picture discs are created using a fascinating 'sandwich' technique - a printed image is placed between two thin layers of clear vinyl, which are then pressed together. This construction method makes them visually stunning but can introduce slight audio compromises, which is why they're primarily valued by collectors for their aesthetic appeal.",
  "Jack White of The White Stripes set an incredible world record by releasing the fastest-produced vinyl record in history - recorded, mastered, pressed, and sold to the public in under 4 hours. This Third Man Records stunt demonstrated both the efficiency of modern pressing and White's commitment to the vinyl format.",
  "Some vinyl records feature hidden locked grooves in the inner groove area that play endlessly on repeat. Artists like The Beatles used this technique to create surprise messages or sounds that loop indefinitely until the listener lifts the tonearm, adding an interactive element to the listening experience.",
  "The most expensive vinyl record collection ever sold at auction belonged to record archive founder Paul Mawhinney, valued at over $3 million. His collection contained more than 3 million records and was considered one of the most comprehensive archives of popular music recorded on vinyl in existence.",
  "Flexi discs - thin, flexible records made of soft vinyl - were incredibly popular promotional items in the 1970s and 1980s. Magazines would include them as free giveaways, allowing readers to play exclusive tracks or interviews. Though sonically inferior to standard vinyl, they remain nostalgic collectibles today.",
  "In a stunning reversal of the digital music revolution, vinyl outsold CDs in 2022 for the first time since 1987, marking a complete format comeback. What was once considered obsolete technology is now experiencing a golden age, with major artists prioritizing vinyl releases alongside digital formats.",
  "A quality diamond or sapphire stylus can typically play through 1,000+ hours of vinyl before requiring replacement. The incredibly hard tip slowly wears down from friction with the record groove, but with proper care and tracking force, a good cartridge represents years of listening pleasure.",
  "The Beatles' self-titled 1968 album, universally known as \"The White Album,\" was the first commercially released album to feature individual numbering on each copy. Paul McCartney himself owns the most coveted copy - serial number 0000001 - which sold at auction for $790,000 in 2015.",
  "Colored vinyl is created by adding various organic chemical compounds to clear polyvinyl chloride during the manufacturing process. Different pigments create different colors, and modern pressing plants can produce virtually any hue imaginable, from solid colors to marbled and splattered effects that make each record unique.",
  "The thickest vinyl record ever manufactured measured an incredible 7mm thick - compared to normal records which measure just 1-2mm. These ultra-heavy specialty pressings are more novelty items than practical releases, as standard turntables and styli aren't really designed to handle such extreme thickness.",
  "The Discogs database has documented and cataloged over 14 million different vinyl releases as of 2023, making it the world's largest and most comprehensive music database. This crowdsourced platform has become essential for collectors, helping them identify pressings, track values, and buy/sell records globally.",
  "A single 12\" vinyl record contains between 500-600 meters (up to 2,000 feet) of continuous spiral groove etched into its surface. The groove spacing gets tighter as you move toward the center of the record, which is why audio quality can slightly degrade on the inner tracks of each side.",
  "The first commercially successful vinyl long-playing record was Mendelssohn's Violin Concerto, released by Columbia Records in 1948. This classical piece was chosen specifically to demonstrate the new format's ability to play extended compositions without interruption, marking the beginning of the LP era.",
  "Glow-in-the-dark vinyl records actually exist and are created by adding phosphorescent compounds to the vinyl mixture. These special pressings charge under light exposure and then emit an eerie glow in darkness. While they're visually spectacular, audiophiles generally avoid them as the additives can affect sound quality.",
  "The heaviest production vinyl record ever made weighs approximately 500 grams - more than triple the weight of a standard 180g audiophile pressing. This ultra-heavyweight special edition was released by Third Man Records and requires a robust turntable with strong motor torque to maintain proper playing speed.",
  "Inner groove distortion is a real phenomenon that affects the last 2-3 songs on each vinyl side. As the groove spirals toward the center, its radius decreases and the linear velocity slows, making it harder for the stylus to accurately trace the tighter curves, resulting in slight audio degradation on inner tracks.",
  "Audiophile vinyl pressings specifically use virgin vinyl - pure PVC with no recycled material mixed in - to achieve the cleanest possible sound reproduction. Recycled vinyl can contain impurities and inconsistencies that introduce surface noise and compromise fidelity, which is why premium pressings command higher prices.",
  "Japanese engineers successfully created the world's smallest playable record at just 3.5mm in diameter - about the size of a small button. While it requires a microscope and specialized equipment to play, it demonstrates the incredible precision possible with vinyl groove technology and captured a Guinness World Record.",
  "Record Store Day (RSD) started in 2007 as a celebration of independent record stores and has since released over 3,000 exclusive vinyl titles. These limited editions often feature unreleased tracks, special colored vinyl, or unique artwork, making them instant collectibles that sell out within hours each April.",
  "Mono vinyl pressings often deliver superior sound quality compared to stereo for recordings originally mixed in mono, particularly pre-1967 albums. Many classic rock and jazz albums were mixed for mono, and modern stereo remasters can introduce artificial separation that wasn't in the artist's original vision.",
  "The old trick of placing a penny on top of the tonearm to stop record skipping is actually terrible advice that will damage both your stylus and your records. The additional weight increases tracking force far beyond recommended specifications, causing accelerated wear to the delicate groove walls and destroying your cartridge.",
  "Bob Dylan's landmark 1966 album \"Blonde on Blonde\" was the first official double album released on vinyl, spreading across four sides and clocking in at over 70 minutes. This groundbreaking release proved that albums could be artistic statements beyond the traditional single-disc format limitations.",
  "Warped vinyl records can sometimes be salvaged by carefully placing them between two sheets of clean glass and gently heating them in an oven at very low temperature. This process can flatten minor warps, though it requires extreme caution and patience, and severely warped records may be impossible to fully restore.",
  "Half-speed mastering is a premium vinyl cutting technique where the master tape plays at half its normal speed (16⅔ RPM for a 33⅓ record) during the cutting process. This allows the cutting lathe more time to accurately trace complex waveforms, theoretically resulting in higher fidelity final pressings that better capture the original recording.",
  "Test pressings (TPs) are the initial 3-5 copies pressed before a full production run, used for quality control approval. These ultra-rare pressings feature plain white labels and are sent to artists and producers for final approval. Among collectors, original test pressings are considered the holy grail and can sell for thousands of dollars.",
  "Brazilian businessman Zero Freitas owns the world's largest privately owned vinyl collection with over 6 million records - a collection similar in size to the entire Discogs database. His São Paulo warehouse houses an extraordinary archive focused on preserving rare North and South American music, with plans to catalogue it all for public access.",
  "The Guinness World Record for largest collection of coloured vinyl records is held by Alessandro Benedetti of Italy, who amassed 1,507 different coloured pressings. His extraordinary collection includes 998 coloured LPs, 158 picture discs, 304 coloured singles, and 30 records in unusual shapes, documenting the vibrant history of coloured vinyl.",
  "In one remarkable acquisition, Zero Freitas received 25,000 regional Brazilian records from Ceará state in a single batch - and discovered that 20,000 of them were recordings his team had never heard before. These regional pressings represent invaluable cultural documents of music that never reached major radio stations or distribution networks.",
  "Radio stations were once treasure troves of vinyl - one Brazilian radio station alone sent Zero Freitas 30,000 records from their archives. These radio copies often include promotional pressings, rare edits, and regional releases that never received commercial distribution, making them extraordinarily valuable to serious collectors and researchers.",
  "As you travel along Brazil's coast, a different rhythmic musical tradition emerges every 100 kilometres. Throughout the golden era of vinyl in the 1960s and 70s, creative fusions were recorded in countless scattered towns, resulting in thousands of rare regional pressings that documented extraordinary musical diversity now being preserved in collections like Freitas's archive.",
  "The analogue warmth of vinyl comes from its physical 'impurities' - what French anthropologist Claude Lévi-Strauss called the 'paradox of civilisation.' While we often try to eliminate imperfections, it's precisely these sonic 'impurities' and the medium's inherent grittiness that give vinyl its distinctive warmth and emotional resonance that digital formats struggle to replicate.",
  "Zero Freitas philosophically notes that 'records do not belong to me - they are provisionally with me.' Many vintage records contain handwritten messages like 'this record belongs to this person, 1958,' yet as Freitas observes, 'not even on that day did it belong to that person. It was more likely that the person belonged to the record.'",
  "The phrase 'disco é cultura' (disc is culture) has been traditionally inscribed on countless Brazilian and Latin American vinyl records from Rio to Bogotá, from Havana to Buenos Aires. This motto reflects a deep cultural understanding that vinyl records preserve not just music, but artistic expression, visual design, poetry, fashion, and social commentary.",
  "Independent Brazilian labels like Somatória Do Barulho and Candonga are now reprinting obscure gems that never made it beyond test-pressing stage in the 1960s-70s. This younger generation, born when vinyl was supposedly dying, is bringing forgotten regional masterpieces back to life and introducing them to modern collectors worldwide.",
  "During vinyl's 'golden era' in the 1960s and 70s, creative fusions were occurring in towns scattered along enormous coastlines, with each region developing its own sound. Thousands of these rare singles and obscure albums documented independent production and musical innovation that mainstream labels never captured or distributed beyond local markets.",
  "Vinyl records are increasingly being recognized as cultural artifacts worthy of preservation, similar to how we value rare books. Large collections function as private libraries with significant cultural import and aesthetic appeal, preserving not just sounds but entire eras of artistic expression, packaging design, and musical innovation.",
  "The distinctive 'warmth' of analogue vinyl comes from it being what media theorist Marshall McLuhan called a 'hot medium' - one that's analogous to life itself. The sound may be technically 'dirtier' than digital, but this imperfection creates emotional resonance. As one collector notes, 'it reflects us' in ways that perfectly clean digital formats cannot.",
  "Some of the rarest vinyl records in the world include regional Brazilian pressings from the 1960s-70s that documented local musical traditions never heard beyond their town or state. These cultural time capsules are worth nothing monetarily but possess extraordinary sociological and cultural value, preserving musical ecologies that might otherwise be lost forever.",
  "The world record for the shortest time to produce a vinyl record is under 4 hours - from recording to pressed vinyl in customers' hands. This incredible feat, accomplished by Jack White's Third Man Records, demonstrated that despite vinyl's reputation as a slow medium, modern pressing technology combined with dedication can achieve remarkable speed."
]

// Shuffle function using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function VinylFactsCard() {
  // Randomize facts each time component mounts using useState initializer
  const [shuffledFacts] = useState(() => shuffleArray(ALL_VINYL_FACTS))
  const [currentFact, setCurrentFact] = useState(0)

  useEffect(() => {
    const factInterval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % shuffledFacts.length)
    }, 12000)

    return () => clearInterval(factInterval)
  }, [shuffledFacts.length])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 overflow-hidden relative">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 animate-gradient-shift-bg"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🎵</div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Did You Know?
          </h3>
          <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mt-2 rounded-full"></div>
        </div>

        {/* Fact Display with Slide Animation */}
        <div className="min-h-[120px] flex items-center justify-center">
          <p 
            key={currentFact}
            className="text-sm leading-relaxed text-center text-gray-700 dark:text-gray-200 animate-fact-slide-in px-4"
          >
            {shuffledFacts[currentFact]}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift-bg {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes fact-slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-gradient-shift-bg {
          animation: gradient-shift-bg 4s ease-in-out infinite;
        }
        .animate-fact-slide-in {
          animation: fact-slide-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

