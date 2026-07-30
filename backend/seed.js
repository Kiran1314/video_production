const mongoose = require('mongoose');
const Media = require('./models/Media'); // Adjust path if your model is elsewhere

// Use the updated database name and remove deprecated options
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/video-portal'; 

const seedData = [
  // --- Event Productions ---
  { url: 'https://www.youtube.com/watch?v=uMwgrpkAqZo', tags: '(Event) (Testimonial)', title: 'Sharjah Ladies Club' },
  { url: 'https://www.youtube.com/watch?v=ZsnbWnpyiWo', tags: '(Event) (Testimonial)', title: 'Informa' },
  { url: 'https://www.youtube.com/watch?v=pVkCroer8oc', tags: '(Event)', title: 'HR Summit & Expo' },
  { url: 'https://www.youtube.com/watch?v=Up7tTIW4eg0', tags: '(Group Discussion)', title: 'Etisalat Group' },
  { url: 'https://www.youtube.com/watch?v=ONGN9eTNUzs', tags: '(Event) (Testimonial)', title: 'Unify' },
  { url: 'https://www.youtube.com/watch?v=Dw-f12B_X-M', tags: '(Event)', title: 'HAAD Corporate Event' },
  { url: 'https://www.youtube.com/watch?v=F54oY2qkvZ4', tags: '(Event)', title: 'Agnice Iftar Event' },
  { url: 'https://www.youtube.com/watch?v=qQaNVxdMI30', tags: '(Event)', title: 'Informa' },
  { url: 'https://www.youtube.com/watch?v=yiqLE3gXhYA', tags: '(Event) (Testimonial)', title: 'Informa' },
  { url: 'https://www.youtube.com/watch?v=IbG7X1J8AOo', tags: '(Event) (Testimonial)', title: 'Informa' },
  { url: 'https://www.youtube.com/watch?v=yPJb1SCWYrs', tags: '(Event) (Testimonial)', title: 'Informa Connect' },
  { url: 'https://www.youtube.com/watch?v=6K3g7UvryKI', tags: '(Event)', title: 'Informa Public Speaking Class' },
  { url: 'https://www.youtube.com/watch?v=iOfU_a-wbok', tags: '(Conference) (Testimonial)', title: 'Informa' },
  { url: 'https://www.youtube.com/watch?v=H3Ov36a4Dk4', tags: '(Conference) (Testimonial)', title: 'Informa' },
  { url: 'https://www.youtube.com/watch?v=UecZN19nXT8', tags: '(Conference) (Testimonial)', title: 'Informa' },
  { url: 'https://www.youtube.com/watch?v=BhgUSeXn0sI', tags: '(Event)', title: 'Informa' },

  // --- Corporate Videos ---
  { url: 'https://www.youtube.com/watch?v=T2QXEV3bwcg', tags: '(Corporate Presentation)', title: 'Al Khaleej' },
  { url: 'https://www.youtube.com/watch?v=5lLXv-CsmUk', tags: '(Corporate Presentation)', title: 'Scitra' },
  { url: 'https://www.youtube.com/watch?v=ORqROH8rsJ4', tags: '(Corporate Presentation)', title: 'ACME' },
  { url: 'https://www.youtube.com/watch?v=Xsym-oTEwEw', tags: '(Corporate Presentation)', title: 'Mirr Oils' },
  { url: 'https://www.youtube.com/watch?v=sd_Pzgf0hjo', tags: '(Corporate Presentation)', title: 'Al Khaleej' },
  { url: 'https://www.youtube.com/watch?v=PMPVLi8nOG8', tags: '(Corporate Presentation)', title: 'Everhot' },
  { url: 'https://www.youtube.com/watch?v=BkcuAekmsAg', tags: '(Corporate Presentation) (Testimonial)', title: 'Healthy Farm' },
  { url: 'https://www.youtube.com/watch?v=RD20RzDk44M', tags: '(Corporate Presentation)', title: 'Everhot' },
  { url: 'https://www.youtube.com/watch?v=0FI_FSveQuc', tags: '(Corporate Presentation)', title: 'Thar Oil' },
  { url: 'https://www.youtube.com/watch?v=fES0RrePKGE', tags: '(Corporate Presentation) (Testimonial)', title: 'Healthy Farm' },
  { url: 'https://www.youtube.com/watch?app=desktop&v=pm3P5J1jUNo', tags: '(Corporate Presentation)', title: 'SCAN Electromechanical Cont. Co. LLC' },
  { url: 'https://www.youtube.com/watch?v=QSmXDvSTM0E', tags: '(Corporate Presentation)', title: 'Scitra' },
  { url: 'https://www.youtube.com/watch?v=z54WbCZ1XIw', tags: '(Corporate Presentation) (Drone Footage)', title: 'Classic Metallic Sheets Factory LLC' },
  { url: 'https://www.youtube.com/watch?v=zXATWpEPMR8', tags: '(Corporate Presentation) (Drone Footage)', title: 'Emitech' },
  { url: 'https://www.youtube.com/watch?v=zoesWAlB9as', tags: '(Corporate Presentation)', title: 'Galadari' },
  { url: 'https://www.youtube.com/watch?v=W3TlyH91GJM', tags: '(Corporate Presentation)', title: 'Perma Pipe' },
  { url: 'https://www.youtube.com/watch?v=7IuLXDP69cg', tags: '(Corporate Presentation)', title: 'Pulse Smart Residence' },
  { url: 'https://www.youtube.com/watch?v=-aPj_zk-Z3A', tags: '(Corporate Presentation)', title: 'Speedex Tools & Hardware' },
  { url: 'https://www.youtube.com/watch?v=Izv10G1NMmk', tags: '(Corporate Presentation)', title: 'Power Group' },
  { url: 'https://www.youtube.com/watch?v=F_XOl5dmdE8', tags: '(Corporate Presentation)', title: 'Zulekha Hospital LLC' },
  { url: 'https://www.youtube.com/watch?app=desktop&v=bdGfsbB3OH4', tags: '(Corporate Presentation)', title: 'Skynet' },
  { url: 'https://www.youtube.com/watch?v=hato_gAql5E', tags: '(Corporate Presentation)', title: 'Zulekha Hospital LLC' },

  // --- Timelapse Productions ---
  { url: 'https://www.youtube.com/watch?v=m7s_bBwnkxU', tags: '(Timelapse)', title: 'Enova' },
  { url: 'https://www.youtube.com/watch?v=BKM4ROd5nr8', tags: '(Timelapse)', title: 'Majid Al Futtaim' },
  { url: 'https://www.youtube.com/watch?v=IacUWAZwgls', tags: '(Timelapse)', title: 'Scan Electro Mechanical' },
  { url: 'https://www.youtube.com/watch?v=r1gTHQhUXOM', tags: '(Timelapse)', title: 'Enova' },
  { url: 'https://www.youtube.com/watch?v=UtHhr5yNJRo', tags: '(Timelapse)', title: 'Enova' },

  // --- Drone Productions ---
  { url: 'https://www.youtube.com/watch?v=3UHRsLUKDNg', tags: '(Drone Footage)', title: 'Drone Showcase' },
  { url: 'https://www.youtube.com/watch?v=VCBpPd-_w2w', tags: '(Drone Footage)', title: 'Drone Showcase' },
  { url: 'https://www.youtube.com/watch?v=szc17K-ZsG0', tags: '(Drone Footage) (Timelapse)', title: 'Enova' },
  { url: 'https://www.youtube.com/watch?v=YUg2iVqLPzo', tags: '(Drone Footage)', title: 'Enova' },
  { url: 'https://www.youtube.com/watch?app=desktop&v=cSrsOeWn5I4', tags: '(Drone Footage)', title: 'Emitech' },
  { url: 'https://www.youtube.com/watch?app=desktop&v=i_7LIl5D0Ws', tags: '(Drone Footage)', title: 'The Oberoi Beach Resort' },
  { url: 'https://www.youtube.com/watch?v=9MwZ-T4qlco', tags: '(Corporate Presentation) (Drone Footage)', title: 'Classic Metallic Sheets Factory LLC' },

  // --- Testimonial Videos ---
  { url: 'https://www.youtube.com/watch?v=0Q6nbRPw6FM&t=388s', tags: '(Testimonial)', title: 'Al Sharq Hospital' },
  { url: 'https://www.youtube.com/watch?v=q0LbDWQghSE', tags: '(Testimonial)', title: 'Canon' },
  { url: 'https://www.youtube.com/watch?v=ijygND8UMi8', tags: '(Testimonial)', title: 'Power Group' },
  { url: 'https://www.youtube.com/watch?v=Ukok_pkecaQ', tags: '(Testimonial)', title: 'Western Union' },
  { url: 'https://www.youtube.com/watch?v=CVrthZ1vHMY', tags: '(Testimonial)', title: 'Informa' },
  { url: 'https://www.youtube.com/watch?v=Z3QhKuyDoTM', tags: '(Testimonial)', title: 'Informa' },
  { url: 'https://www.youtube.com/watch?v=8nPY0WYSZow', tags: '(Testimonial)', title: 'ADAA' },
  { url: 'https://www.youtube.com/watch?app=desktop&v=JVBQySsED44', tags: '(Testimonial)', title: 'Mena Water' },
  { url: 'https://www.youtube.com/watch?v=s04F3vMWzhM', tags: '(Testimonial)', title: 'Western Union' },
  { url: 'https://www.youtube.com/watch?v=HUmqngabxEQ', tags: '(Corporate) (Testimonial)', title: 'Waterfront Market' },
  { url: 'https://www.youtube.com/watch?app=desktop&v=4k9XLjKB5pc', tags: '(Testimonial)', title: 'NRI Media' },

  // --- 360° Videos ---
  { url: 'https://www.youtube.com/watch?v=3JYKRGzJ4og', tags: '(360° Footage)', title: '360° Experience' },
  { url: 'https://www.youtube.com/watch?v=Kwnb64MnGbw', tags: '(360° Footage)', title: '360° Experience' },
  { url: 'https://www.youtube.com/watch?v=aRTLsRoA_CI', tags: '(360° Footage)', title: '360° Experience' },
  { url: 'https://www.youtube.com/watch?v=43VvUTAoE2o', tags: '(360° Footage)', title: '360° Experience' },

  // --- Tutorial & E-Learning ---
  { url: 'https://www.youtube.com/watch?v=vENU9kXnZRA', tags: '(E-Learning)', title: 'Driving Classes' },
  { url: 'https://www.youtube.com/watch?v=mdSOGQcRiMQ', tags: '(E-Learning)', title: 'Driving Classes' },
  { url: 'https://www.youtube.com/watch?v=LhFD5ksDn3U', tags: '(Tutorial) (Animation)', title: 'TCL GCC' },
  { url: 'https://www.youtube.com/watch?v=P8R2fYMU1ug', tags: '(E-Learning)', title: 'Driving Classes' },
  { url: 'https://www.youtube.com/watch?v=MyI7wCHAnV4', tags: '(E-Learning)', title: 'Driving Classes' },
  { url: 'https://www.youtube.com/watch?v=n4rMk-9A70k', tags: '(E-Learning)', title: 'Driving Classes' },
  { url: 'https://www.youtube.com/watch?v=7_CBQojYgxM', tags: '(E-Learning)', title: 'Driving Classes' },
  { url: 'https://www.youtube.com/watch?v=A27rh4QneXo', tags: '(Tutorial)', title: 'General Tutorial' },
  { url: 'https://www.youtube.com/watch?v=QJp_aCNyOQY', tags: '(Tutorial) (Animation)', title: 'Dubai Tourism' },

  // --- Commercials ---
  { url: 'https://www.youtube.com/watch?v=2zyRRmCpTSA', tags: '(Commercial)', title: 'Buraq Car Rental' },
  { url: 'https://www.youtube.com/watch?v=KZmduB-zE2E', tags: '(Commercial) (Animation)', title: 'BNC Network' },
  { url: 'https://www.youtube.com/watch?v=rPLxJIXUul4', tags: '(Commercial)', title: 'Buraq Car Rental' },
  { url: 'https://www.youtube.com/watch?v=RWyYvHb67uk', tags: '(Commercial) (Animation)', title: 'Finance House' },
  { url: 'https://www.youtube.com/watch?v=c8vyaPRNxn4', tags: '(Commercial) (Animation)', title: 'Cavallo' },
  { url: 'https://www.youtube.com/watch?v=FuVZ-f3BV1g', tags: '(Commercial)', title: 'Tapas Power Yoga Center' },
  { url: 'https://www.youtube.com/watch?v=oRSJNX0XEiw', tags: '(Commercial)', title: 'Motorol Lubricants' },
  { url: 'https://www.youtube.com/watch?v=LtEzoIm36C8', tags: '(Commercial) (Animation)', title: 'Milano' },
  { url: 'https://www.youtube.com/watch?v=1oQ6CEST0fM', tags: '(Commercial)', title: 'Super General' },
  { url: 'https://www.youtube.com/watch?v=sWtLbRwxERg', tags: '(Commercial)', title: 'Matrix Education' },
  { url: 'https://www.youtube.com/watch?v=YH4JeCUJ71o', tags: '(Commercial)', title: 'Speedex' },
  { url: 'https://www.youtube.com/watch?v=cFfiQ5cCm7k', tags: '(Commercial)', title: 'Al Sharq Hospital' },
  { url: 'https://www.youtube.com/watch?v=HplmcCvmDPg', tags: '(Commercial)', title: 'Finance House' },
  { url: 'https://www.youtube.com/watch?v=A7_4pAOtmWI', tags: '(Commercial)', title: 'Buraq Car Rental' },
  { url: 'https://www.youtube.com/watch?v=LQZTw2qBOQw', tags: '(Commercial)', title: 'CosmoMed' },
  { url: 'https://www.youtube.com/watch?v=991ZI5JJ2SU', tags: '(Commercial)', title: 'Emitech' },
  { url: 'https://www.youtube.com/watch?v=mg9JYkL0wGY', tags: '(Commercial) (Animation)', title: 'Super General' },
  { url: 'https://www.youtube.com/watch?v=cwX0oWz06u4', tags: '(Commercial)', title: 'ZO Restaurant' },
  { url: 'https://www.youtube.com/watch?v=feQpGViAC-A', tags: '(Commercial) (Animation)', title: 'Cavallo' },
  { url: 'https://www.youtube.com/watch?v=3BOhXWUcRQY', tags: '(Commercial) (Animation)', title: 'Cavallo' },
  { url: 'https://www.youtube.com/watch?v=5Xv3wCkJ4KQ', tags: '(Commercial)', title: 'Concert Promo' },
  { url: 'https://www.youtube.com/watch?v=WCXQFAg7ju4', tags: '(Commercial)', title: 'NSO Symphony Orchestra' },
  { url: 'https://www.youtube.com/watch?v=2yqomU6rjj4', tags: '(Commercial) (Animation)', title: 'Super General' },
  { url: 'https://www.youtube.com/watch?v=S_sIzSsgVyA', tags: '(Commercial) (Animation)', title: 'Super General' },
  { url: 'https://www.youtube.com/watch?v=rjqhEsLl2UY', tags: '(Commercial)', title: 'Matrix Education' },

  // --- Dubbing ---
  { url: 'https://www.youtube.com/watch?v=qJxg9lSLpD8', tags: '(Dubbing)', title: 'Urdu' },
  { url: 'https://www.youtube.com/watch?v=AlinFX6ePJE', tags: '(Dubbing)', title: 'English' },
  { url: 'https://www.youtube.com/watch?v=MsVVtI_0_o4', tags: '(Dubbing)', title: 'Hindi' },
  { url: 'https://www.youtube.com/watch?v=S0wyGudHueo', tags: '(Dubbing)', title: 'Hindi' },

  // --- Animation ---
  { url: 'https://www.youtube.com/watch?v=MTuwPmqcFKQ', tags: '(Animation)', title: 'House Tour' },
  { url: 'https://www.youtube.com/watch?v=0BbudrtTAQY', tags: '(Animation)', title: 'Dell' },
  { url: 'https://www.youtube.com/watch?v=JO0kED7fNb8', tags: '(Animation) (E-Learning)', title: 'Car Driving Test' },
  { url: 'https://www.youtube.com/watch?v=K1FainlGRUM', tags: '(Animation) (E-Learning)', title: 'Car Driving Test' },
  { url: 'https://www.youtube.com/watch?v=LxNPHBqH_Y0', tags: '(Animation) (E-Learning)', title: 'Car Driving Test' },
  { url: 'https://www.youtube.com/watch?v=9YwgeCOjuEM', tags: '(Animation) (E-Learning)', title: 'Zebra Traffic System' },
  { url: 'https://www.youtube.com/watch?v=fnRbGpBA_c0', tags: '(Animation)', title: 'Securities & Commodities Authority' },

  // --- AR / VR ---
  { url: 'https://www.youtube.com/watch?app=desktop&v=4StiZ_bQW7Q', tags: '(Augmented Reality)', title: 'AR Experience' },
  { url: 'https://www.youtube.com/watch?app=desktop&v=LQFUyO7pVH0', tags: '(Virtual Reality)', title: 'VR Experience' },
  { url: 'https://www.youtube.com/watch?v=z4RjEz0Wg5M', tags: '(Augmented Reality)', title: 'AR Experience' },

  // --- Social Media Reels ---
  { url: 'https://www.youtube.com/shorts/jTyHmCd4HBU', tags: '(Social Media Reel)', title: 'Social Media Reel 01' },
  { url: 'https://www.youtube.com/shorts/mwwpkud5Yzc', tags: '(Social Media Reel)', title: 'Social Media Reel 02' },
  { url: 'https://www.youtube.com/shorts/F6OQvgGwSI0', tags: '(Social Media Reel)', title: 'Social Media Reel 03' },
  { url: 'https://www.youtube.com/shorts/uCvg7sHNgfw', tags: '(Social Media Reel)', title: 'Social Media Reel 04' },
  { url: 'https://www.youtube.com/shorts/VPb_LEDLSws', tags: '(Social Media Reel)', title: 'Social Media Reel 05' },
  { url: 'https://www.youtube.com/shorts/AynsrZTHeg8', tags: '(Social Media Reel)', title: 'Social Media Reel 06' },
  { url: 'https://www.youtube.com/shorts/nbT6FNHIjqI', tags: '(Social Media Reel)', title: 'Social Media Reel 07' },
  { url: 'https://www.youtube.com/shorts/07PVyPJxe6o', tags: '(Social Media Reel)', title: 'Social Media Reel 08' },
  { url: 'https://www.youtube.com/shorts/0tZg8jnOR9g', tags: '(Social Media Reel)', title: 'Social Media Reel 09' },
  { url: 'https://www.youtube.com/shorts/1Bpqir9X73M', tags: '(Social Media Reel)', title: 'Social Media Reel 10' },
  { url: 'https://www.youtube.com/shorts/9axgYAqeLyg', tags: '(Social Media Reel)', title: 'Social Media Reel 11' }
];

const runSeeder = async () => {
  try {
    console.log('Connecting to database...');
    // Connect without the deprecated options
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    const formattedData = [];

    // Loop through each item in the seedData array
    seedData.forEach(item => {
      // Find all individual tags enclosed in parentheses using regex
      const tagMatches = item.tags.match(/\(([^)]+)\)/g);
      
      if (tagMatches) {
        // Loop through each extracted tag (e.g., ["(Event)", "(Testimonial)"])
        tagMatches.forEach(tag => {
          // Remove the round brackets and trim any whitespace
          const cleanTag = tag.replace(/[()]/g, '').trim();

          // Push a separate database entry for each tag found
          formattedData.push({
            title: item.title,
            description: `Showcase media for ${item.title}`,
            mainCategory: 'Video',
            subCategory: cleanTag, // Now isolated to a single category (e.g., 'Event' OR 'Testimonial')
            mediaUrl: item.url,
            language: '',
            isPublic: true
          });
        });
      }
    });

    console.log(`Inserting ${formattedData.length} documents...`);
    
    // Optional: Uncomment below if you want to clear existing data before seeding
    // await Media.deleteMany({});
    // console.log('Existing media cleared.');

    await Media.insertMany(formattedData);
    
    console.log('Database successfully seeded with split subcategories!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

runSeeder();