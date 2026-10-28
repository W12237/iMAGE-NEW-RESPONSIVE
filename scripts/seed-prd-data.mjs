import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seed() {
  console.log("Seeding PRD data into SQLite...");

  // 1. Update Global Settings with Hotline 17087 & hours
  await db.globalSettings.upsert({
    where: { id: "global" },
    update: {
      hotline: "17087",
      phone: "+20 2 2755 0000",
      contactEmail: "info@imagedevelopments.com",
      companyBrochureUrl: "/brochures/image-developments-profile.pdf",
      workingHoursEn: "Sunday - Thursday: 9:00 AM - 6:00 PM",
      workingHoursAr: "الأحد - الخميس: ٩:٠٠ ص - ٦:٠٠ م",
    },
    create: {
      id: "global",
      siteNameEn: "Image Developments",
      siteNameAr: "إيمدج للتطوير العقاري",
      contactEmail: "info@imagedevelopments.com",
      phone: "+20 2 2755 0000",
      hotline: "17087",
      companyBrochureUrl: "/brochures/image-developments-profile.pdf",
      workingHoursEn: "Sunday - Thursday: 9:00 AM - 6:00 PM",
      workingHoursAr: "الأحد - الخميس: ٩:٠٠ ص - ٦:٠٠ م",
      addressEn: "Building 12, South 90th Street, New Cairo, Egypt",
      addressAr: "مبنى ١٢، شارع التسعين الجنوبي، القاهرة الجديدة، مصر",
      copyrightEn: "© 2026 Image Developments. All rights reserved.",
      copyrightAr: "© 2026 إيمدج للتطوير العقاري. جميع الحقوق محفوظة.",
      defaultSeoTitleEn: "Image Developments — Considered Real Estate & Architecture",
      defaultSeoTitleAr: "إيمدج للتطوير العقاري — عمارة ومجتمعات برؤية معاصرة",
      defaultSeoDescriptionEn: "Image Developments creates considered communities across Egypt.",
      defaultSeoDescriptionAr: "تطور إيمدج مجتمعات سكنية وتجارية مدروسة في أنحاء مصر.",
      menuMediaUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=86",
      menuMediaAltEn: "Warm architectural interior",
      menuMediaAltAr: "تصميم داخلي معماري دافئ",
    },
  });

  // 2. Enrich Projects with 10 PRD detail sections
  const aeraUpdates = {
    projectType: "Residential",
    progressStatus: "Ongoing",
    masterPlanUrl: "https://images.unsplash.com/photo-1524813686514-a57563d77d61?auto=format&fit=crop&w=2000&q=88",
    brochureUrl: "/brochures/aera-residences-brochure.pdf",
    videoTourUrl: "https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-41584-large.mp4",
    latitude: 30.0131,
    longitude: 31.4913,
    mapUrl: "https://maps.google.com/?q=30.0131,31.4913",
    fullDescriptionEn:
      "Aera is conceived as a serene residential sanctuary in the heart of New Cairo. Balancing contemporary brutalist-inspired proportions with lush subtropical gardens, each home is crafted to maximize light, privacy, and outdoor flow.",
    fullDescriptionAr:
      "صُمم مشروع إيرا ليكون ملاذاً سكنياً هادئاً في قلب القاهرة الجديدة. يجمع بين النسب المعمارية المعاصرة والحدائق الوارفة، حيث صُمم كل منزل لتعزيز تدفق الضوء والخصوصية والانفتاح على الطبيعة.",
    keyFacts: JSON.stringify([
      { labelEn: "Total Land Area", labelAr: "إجمالي المساحة", valueEn: "45 Acres", valueAr: "٤٥ فداناً" },
      { labelEn: "Footprint Ratio", labelAr: "نسبة البناء", valueEn: "18% Built-up", valueAr: "١٨٪ مساحات مبنية" },
      { labelEn: "Open Greenery", labelAr: "المساحات المفتوحة", valueEn: "82% Landscape", valueAr: "٨٢٪ حدائق ومسطحات" },
      { labelEn: "Delivery Timeline", labelAr: "موعد التسليم", valueEn: "Q4 2027", valueAr: "الربع الرابع ٢٠٢٧" },
    ]),
    highlights: JSON.stringify([
      {
        titleEn: "Central Botanical Spine",
        titleAr: "المحور النباتي المركزي",
        descriptionEn: "Continuous pedestrian promenade shaded by mature native trees.",
        descriptionAr: "ممشى مشاة متصل ومظلل بأشجار أصيلة توفر برودة طبيعية.",
        icon: "trees",
      },
      {
        titleEn: "Private Wellness Clubhouse",
        titleAr: "نادي صحي ورياضي متكامل",
        descriptionEn: "Featuring lap pools, pilates studio, and community lounge.",
        descriptionAr: "يضم حمامات سباحة رياضية واستوديو بيلاتس وصالة مجتمعية.",
        icon: "activity",
      },
      {
        titleEn: "Double-Height Ceilings",
        titleAr: "ارتفاعات أسقف مزدوجة",
        descriptionEn: "Volumetric spatial design offering abundant daylight throughout.",
        descriptionAr: "تصميم فراغي رحب يوفر إضاءة نهارية طبيعية وانفتاحاً رحباً.",
        icon: "maximize",
      },
    ]),
    unitTypes: JSON.stringify([
      {
        id: "aera-penthouse",
        nameEn: "Sky Penthouse",
        nameAr: "بنتهاوس علوي",
        areaEn: "245 – 310 sqm",
        areaAr: "٢٤٥ – ٣١٠ م²",
        finishingEn: "Fully Finished with VRV A/C",
        finishingAr: "تشطيب متكامل مع تكييف VRV",
        paymentEn: "10% Downpayment, 7 Years Installments",
        paymentAr: "١٠٪ مقدم، تقسيط على ٧ سنوات",
      },
      {
        id: "aera-duplex",
        nameEn: "Garden Duplex",
        nameAr: "دوبلكس بحديقة",
        areaEn: "195 – 240 sqm",
        areaAr: "١٩٥ – ٢٤٠ م²",
        finishingEn: "Semi-Finished Core & Shell",
        finishingAr: "نصف تشطيب عالي الجودة",
        paymentEn: "10% Downpayment, 8 Years Installments",
        paymentAr: "١٠٪ مقدم، تقسيط على ٨ سنوات",
      },
      {
        id: "aera-apt",
        nameEn: "Luxury Residence",
        nameAr: "شقة سكنية فاخرة",
        areaEn: "135 – 180 sqm",
        areaAr: "١٣٥ – ١٨٠ م²",
        finishingEn: "Fully Finished Premium",
        finishingAr: "تشطيب الترا لوكس",
        paymentEn: "10% Downpayment, 7 Years Installments",
        paymentAr: "١٠٪ مقدم، تقسيط على ٧ سنوات",
      },
    ]),
    nearbyLocations: JSON.stringify([
      { nameEn: "American University in Cairo (AUC)", nameAr: "الجامعة الأمريكية بالقاهرة", distanceEn: "8 Mins", distanceAr: "٨ دقائق" },
      { nameEn: "Cairo International Airport", nameAr: "مطار القاهرة الدولي", distanceEn: "18 Mins", distanceAr: "١٨ دقيقة" },
      { nameEn: "Golden Square District", nameAr: "منطقة المربع الذهبي", distanceEn: "5 Mins", distanceAr: "٥ دقائق" },
      { nameEn: "Middle Ring Road", nameAr: "الطريق الدائري الأوسطي", distanceEn: "4 Mins", distanceAr: "٤ دقائق" },
    ]),
    constructionUpdates: JSON.stringify([
      {
        date: "October 2026",
        titleEn: "Zone A Structural Pouring & Basement Completion",
        titleAr: "صب الخرسانات المسلحة واكتمال البدروم للمنطقة أ",
        imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=85",
        isVideo: false,
      },
      {
        date: "August 2026",
        titleEn: "Deep Foundation & Earthworks Milestone",
        titleAr: "اكتمال أعمال الحفر والإحلال والأساسات العميقة",
        imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=85",
        isVideo: false,
      },
    ]),
  };

  const solayaUpdates = {
    projectType: "Commercial",
    progressStatus: "Ongoing",
    masterPlanUrl: "https://images.unsplash.com/photo-1524813686514-a57563d77d61?auto=format&fit=crop&w=2000&q=88",
    brochureUrl: "/brochures/solaya-destination-brochure.pdf",
    videoTourUrl: "https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-41584-large.mp4",
    latitude: 30.0612,
    longitude: 30.9324,
    mapUrl: "https://maps.google.com/?q=30.0612,30.9324",
    fullDescriptionEn:
      "Solaya introduces a progressive destination along the vibrant corridor of New Zayed. Designed around open sunlit courtyards, boutique retail, and creative commercial suites.",
    fullDescriptionAr:
      "يقدم سولايا وجهة معاصرة متميزة على امتداد محور زايد الجديدة، مصممة حول ساحات مفتوحة غنية بالضوء ومتاجر حصرية ومكاتب أعمال متطورة.",
    keyFacts: JSON.stringify([
      { labelEn: "Total Area", labelAr: "المساحة الإجمالية", valueEn: "32 Acres", valueAr: "٣٢ فداناً" },
      { labelEn: "Commercial GLA", labelAr: "المساحات التأجيرية", valueEn: "48,000 sqm", valueAr: "٤٨,٠٠٠ م²" },
      { labelEn: "Plaza Footprint", labelAr: "مساحة الساحات", valueEn: "60% Pedestrian", valueAr: "٦٠٪ مشاة وبلازا" },
      { labelEn: "Delivery Timeline", labelAr: "موعد التسليم", valueEn: "Q2 2028", valueAr: "الربع الثاني ٢٠٢٨" },
    ]),
    highlights: JSON.stringify([
      {
        titleEn: "Sunlit Terraced Plazas",
        titleAr: "ساحات متدرجة مضيئة",
        descriptionEn: "Cascading terraces designed for premier al fresco dining.",
        descriptionAr: "شرفات متدرجة مصممة لأرقى المطاعم والمقاهي المفتوحة.",
        icon: "sun",
      },
      {
        titleEn: "Executive Office Pavilions",
        titleAr: "مكاتب أعمال تنفيذية",
        descriptionEn: "Bespoke corporate spaces with dedicated underground parking.",
        descriptionAr: "مساحات مكتبية متطورة مع مواقف سيارات تحت الأرض مخصصة.",
        icon: "briefcase",
      },
    ]),
    unitTypes: JSON.stringify([
      {
        id: "solaya-office",
        nameEn: "Executive Office Suite",
        nameAr: "مكتب تنفيذي متميز",
        areaEn: "85 – 175 sqm",
        areaAr: "٨٥ – ١٧٥ م²",
        finishingEn: "Core & Shell with Fiber Optic",
        finishingAr: "نصف تشطيب مع بنية ذكية",
        paymentEn: "15% Downpayment, 6 Years Installments",
        paymentAr: "١٥٪ مقدم، تقسيط على ٦ سنوات",
      },
      {
        id: "solaya-retail",
        nameEn: "Promenade Retail Boutique",
        nameAr: "محل تجاري على الممشى",
        areaEn: "110 – 260 sqm",
        areaAr: "١١٠ – ٢٦٠ م²",
        finishingEn: "Double-Height Storefront",
        finishingAr: "واجهة زجاجية بارتفاع مزدوج",
        paymentEn: "15% Downpayment, 6 Years Installments",
        paymentAr: "١٥٪ مقدم، تقسيط على ٦ سنوات",
      },
    ]),
    nearbyLocations: JSON.stringify([
      { nameEn: "Waslet Dahshur Highway", nameAr: "وصلة دهشور", distanceEn: "3 Mins", distanceAr: "٣ دقائق" },
      { nameEn: "Mall of Arabia", nameAr: "مول العرب", distanceEn: "12 Mins", distanceAr: "١٢ دقيقة" },
      { nameEn: "Sphinx International Airport", nameAr: "مطار سفنكس الدولي", distanceEn: "15 Mins", distanceAr: "١٥ دقيقة" },
    ]),
    constructionUpdates: JSON.stringify([]),
  };

  const mareaUpdates = {
    projectType: "Residential",
    progressStatus: "Upcoming",
    masterPlanUrl: "https://images.unsplash.com/photo-1524813686514-a57563d77d61?auto=format&fit=crop&w=2000&q=88",
    brochureUrl: "/brochures/marea-coastal-brochure.pdf",
    videoTourUrl: "https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-41584-large.mp4",
    latitude: 30.9821,
    longitude: 28.7123,
    mapUrl: "https://maps.google.com/?q=30.9821,28.7123",
    fullDescriptionEn:
      "Marea is a Mediterranean seaside enclave on Egypt's North Coast, capturing a slower and more elemental rhythm of coastal living.",
    fullDescriptionAr:
      "ماريا هي وجهة ساحلية متوسطية على الساحل الشمالي لمصر، تلهم إيقاعاً أهدأ وأكثر تناغماً مع البحر والطبيعة.",
    keyFacts: JSON.stringify([
      { labelEn: "Beachfront Width", labelAr: "عرض الشاطئ", valueEn: "650 Metres", valueAr: "٦٥٠ متراً" },
      { labelEn: "Total Area", labelAr: "المساحة الإجمالية", valueEn: "70 Acres", valueAr: "٧٠ فداناً" },
      { labelEn: "Elevation", labelAr: "التدرج الطبوغرافي", valueEn: "32m Natural Rise", valueAr: "تدرج طبيعي ٣٢ متراً" },
      { labelEn: "Delivery Timeline", labelAr: "موعد التسليم", valueEn: "Summer 2028", valueAr: "صيف ٢٠٢٨" },
    ]),
    highlights: JSON.stringify([
      {
        titleEn: "Direct Swimmable Lagoons",
        titleAr: "بحيرات كريستالية قابلة للسباحة",
        descriptionEn: "Crystal-clear lagoons surrounding every neighborhood.",
        descriptionAr: "بحيرات شاطئية رملية تحيط بجميع المراحل السكنية.",
        icon: "water",
      },
    ]),
    unitTypes: JSON.stringify([
      {
        id: "marea-villa",
        nameEn: "Beachfront Standalone Villa",
        nameAr: "فيلا مستقلة على الشاطئ",
        areaEn: "320 – 480 sqm",
        areaAr: "٣٢٠ – ٤٨٠ م²",
        finishingEn: "Ultra-Lux with Infinity Pool",
        finishingAr: "تشطيب فاخر مع حمام سباحة خاص",
        paymentEn: "10% Downpayment, 8 Years Installments",
        paymentAr: "١٠٪ مقدم، تقسيط على ٨ سنوات",
      },
      {
        id: "marea-chalet",
        nameEn: "Lagoon Chalet",
        nameAr: "شاليه على اللاجون",
        areaEn: "115 – 165 sqm",
        areaAr: "١١٥ – ١٦٥ م²",
        finishingEn: "Fully Finished & Furnished",
        finishingAr: "تشطيب كامل بالفرش والتكييفات",
        paymentEn: "10% Downpayment, 8 Years Installments",
        paymentAr: "١٠٪ مقدم، تقسيط على ٨ سنوات",
      },
    ]),
    nearbyLocations: JSON.stringify([
      { nameEn: "Fouka Bay Bayway", nameAr: "طريق الفوكا الجديد", distanceEn: "6 Mins", distanceAr: "٦ دقائق" },
      { nameEn: "Alamein International Airport", nameAr: "مطار العلمين الدولي", distanceEn: "45 Mins", distanceAr: "٤٥ دقيقة" },
    ]),
    constructionUpdates: JSON.stringify([]),
  };

  await db.project.updateMany({ where: { slug: "aera" }, data: aeraUpdates });
  await db.project.updateMany({ where: { slug: "solaya" }, data: solayaUpdates });
  await db.project.updateMany({ where: { slug: "marea" }, data: mareaUpdates });
  console.log("Updated projects with 10 PRD detail sections.");

  // 3. Seed Career Opportunities
  const jobs = [
    {
      slug: "senior-architectural-designer",
      titleEn: "Senior Architectural Designer",
      titleAr: "مصمم معماري أول",
      departmentEn: "Design & Masterplanning",
      departmentAr: "التصميم والتخطيط العمراني",
      locationEn: "New Cairo, Egypt",
      locationAr: "القاهرة الجديدة، مصر",
      descriptionEn:
        "We are looking for a Senior Architectural Designer to drive concept development and spatial narrative across luxury residential and mixed-use destinations.",
      descriptionAr:
        "نبحث عن مصمم معماري أول لقيادة تطوير المفاهيم التصميمية والسرد الفراغي للمشروعات السكنية والمتعددة الاستخدامات الفاخرة.",
      requirementsEn:
        "• Bachelor's Degree in Architecture\n• 6+ years in high-end real estate masterplanning\n• Fluency with Revit, Rhino, and presentation suites\n• Strong design sensibility matching Image brand language",
      requirementsAr:
        "• بكالوريوس في الهندسة المعمارية\n• خبرة ٦ سنوات على الأقل في تصميم المشروعات العقارية الفاخرة\n• إجادة تامة لبرامج Revit وRhino\n• حس تصميمي رفيع يتناغم مع هوية إيمدج",
      sortOrder: 0,
      status: "PUBLISHED",
    },
    {
      slug: "property-sales-consultant",
      titleEn: "Senior Property Sales Consultant",
      titleAr: "مستشار مبيعات عقارية أول",
      departmentEn: "Sales & Client Advisory",
      departmentAr: "المبيعات واستشارات العملاء",
      locationEn: "New Cairo & Zayed Sales Centre",
      locationAr: "فرعا القاهرة الجديدة والشيخ زايد",
      descriptionEn:
        "Responsible for consulting high-net-worth individuals and investors on Image Developments' portfolio of residential and commercial properties.",
      descriptionAr:
        "مسؤول عن تقديم الاستشارات العقارية المتخصصة لكبار العملاء والمستثمرين لمحفظة مشروعات إيمدج السكنية والتجارية.",
      requirementsEn:
        "• 4+ years in premium Egyptian real estate sales\n• Proven track record in East or West Cairo markets\n• Exceptional communication in Arabic and English\n• Client-first consultative methodology",
      requirementsAr:
        "• خبرة ٤ سنوات في المبيعات العقارية الفاخرة\n• سجل حافل في أسواق شرق وغرب القاهرة\n• مهارات تواصل ممتازة باللغتين العربية والإنجليزية\n• أسلوب استشاري يضع العميل أولاً",
      sortOrder: 1,
      status: "PUBLISHED",
    },
    {
      slug: "construction-project-engineer",
      titleEn: "Site Construction Project Engineer",
      titleAr: "مهندس موقع ومشروعات إنشائية",
      departmentEn: "Project Development & Delivery",
      departmentAr: "التطوير والتنفيذ الإنشائي",
      locationEn: "Project Sites (New Cairo)",
      locationAr: "مواقع المشروعات (القاهرة الجديدة)",
      descriptionEn:
        "Overseeing on-site contractor quality, structural milestone execution, and health and safety compliance across project phases.",
      descriptionAr:
        "الإشراف على جودة المقاولين بالموقع وتنفيذ المراحل الإنشائية والالتزام الدقيق بمعايير السلامة والجودة العالمية.",
      requirementsEn:
        "• Civil Engineering degree\n• 5+ years experience on active residential sites\n• Deep knowledge of Egyptian building codes & structural handover",
      requirementsAr:
        "• بكالوريوس هندسة مدنية\n• خبرة ٥ سنوات على الأقل في المواقع الإنشائية السكنية\n• معرفة عميقة بالأكواد الهندسية وإجراءات الاستلام",
      sortOrder: 2,
      status: "PUBLISHED",
    },
  ];

  for (const job of jobs) {
    await db.careerJob.upsert({
      where: { slug: job.slug },
      update: job,
      create: job,
    });
  }
  console.log("Seeded career opportunities.");

  console.log("PRD data seeding completed successfully.");
}

seed()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
