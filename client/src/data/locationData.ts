export interface LocationData {
  countries: Country[];
}

export interface Country {
  name: string;
  code: string;
  states: State[];
}

export interface State {
  name: string;
  code: string;
  cities: string[];
}

export const locationData: LocationData = {
  countries: [
    {
      name: "India",
      code: "IN",
      states: [
        {
          name: "Andhra Pradesh",
          code: "AP",
          cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Anantapur", "Kadapa", "Tirupati", "Kakinada", "Rajahmundry"]
        },
        {
          name: "Arunachal Pradesh",
          code: "AR",
          cities: ["Itanagar", "Naharlagun", "Pasighat", "Bomdila", "Tawang", "Ziro", "Along", "Tezu", "Roing", "Daporijo"]
        },
        {
          name: "Assam",
          code: "AS",
          cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tinsukia", "Sivasagar", "Nagaon", "Barpeta", "Goalpara", "Bongaigaon"]
        },
        {
          name: "Bihar",
          code: "BR",
          cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Arrah", "Begusarai", "Katihar", "Chhapra"]
        },
        {
          name: "Chhattisgarh",
          code: "CG",
          cities: ["Raipur", "Bhilai", "Durg", "Korba", "Bilaspur", "Jagdalpur", "Ambikapur", "Rajnandgaon", "Dhamtari", "Mahasamund"]
        },
        {
          name: "Goa",
          code: "GA",
          cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Valpoi", "Sanquelim", "Curchorem", "Cuncolim"]
        },
        {
          name: "Gujarat",
          code: "GJ",
          cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand", "Bharuch", "Valsad"]
        },
        {
          name: "Haryana",
          code: "HR",
          cities: ["Gurgaon", "Faridabad", "Panipat", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Ambala"]
        },
        {
          name: "Himachal Pradesh",
          code: "HP",
          cities: ["Shimla", "Mandi", "Solan", "Kullu", "Dharamshala", "Chamba", "Bilaspur", "Una", "Hamirpur", "Kangra"]
        },
        {
          name: "Jharkhand",
          code: "JH",
          cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Chatra"]
        },
        {
          name: "Karnataka",
          code: "KA",
          cities: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga"]
        },
        {
          name: "Kerala",
          code: "KL",
          cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Malappuram", "Kannur", "Kottayam"]
        },
        {
          name: "Madhya Pradesh",
          code: "MP",
          cities: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"]
        },
        {
          name: "Maharashtra",
          code: "MH",
          cities: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Nanded"]
        },
        {
          name: "Manipur",
          code: "MN",
          cities: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Senapati", "Ukhrul", "Chandel", "Tamenglong", "Jiribam", "Kakching"]
        },
        {
          name: "Meghalaya",
          code: "ML",
          cities: ["Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar", "Baghmara", "Resubelpara", "Mairang", "Mawkyrwat", "Nongpoh"]
        },
        {
          name: "Mizoram",
          code: "MZ",
          cities: ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Saitual", "Khawzawl"]
        },
        {
          name: "Nagaland",
          code: "NL",
          cities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Mon", "Kiphire", "Longleng"]
        },
        {
          name: "Odisha",
          code: "OD",
          cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"]
        },
        {
          name: "Punjab",
          code: "PB",
          cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Pathankot", "Moga", "Abohar", "Malerkotla", "Khanna"]
        },
        {
          name: "Rajasthan",
          code: "RJ",
          cities: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Sri Ganganagar", "Sikar"]
        },
        {
          name: "Sikkim",
          code: "SK",
          cities: ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Ravongla", "Lachung", "Pelling", "Yuksom", "Rangpo", "Singtam"]
        },
        {
          name: "Tamil Nadu",
          code: "TN",
          cities: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Vellore", "Erode", "Tiruppur", "Thoothukkudi", "Dindigul"]
        },
        {
          name: "Telangana",
          code: "TS",
          cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam", "Khammam", "Mahbubnagar", "Nalgonda", "Adilabad", "Siddipet"]
        },
        {
          name: "Tripura",
          code: "TR",
          cities: ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia", "Khowai", "Teliamura", "Ambassa", "Sabroom", "Kamalpur"]
        },
        {
          name: "Uttar Pradesh",
          code: "UP",
          cities: ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad"]
        },
        {
          name: "Uttarakhand",
          code: "UT",
          cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Kotdwara", "Ramnagar", "Pithoragarh"]
        },
        {
          name: "West Bengal",
          code: "WB",
          cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur"]
        }
      ]
    },
    {
      name: "Bangladesh",
      code: "BD",
      states: [
        {
          name: "Dhaka",
          code: "DH",
          cities: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Narsingdi", "Kishoreganj", "Manikganj", "Munshiganj", "Rajbari", "Madaripur"]
        },
        {
          name: "Chittagong",
          code: "CT",
          cities: ["Chittagong", "Comilla", "Feni", "Chandpur", "Noakhali", "Lakshmipur", "Cox's Bazar", "Rangamati", "Bandarban", "Khagrachari"]
        },
        {
          name: "Rajshahi",
          code: "RJ",
          cities: ["Rajshahi", "Natore", "Naogaon", "Chapainawabganj", "Pabna", "Bogura", "Sirajganj", "Joypurhat", "Magura", "Jhenaidah"]
        },
        {
          name: "Khulna",
          code: "KL",
          cities: ["Khulna", "Jessore", "Satkhira", "Bagerhat", "Kushtia", "Meherpur", "Chuadanga", "Jashore", "Narail", "Magura"]
        },
        {
          name: "Barisal",
          code: "BR",
          cities: ["Barisal", "Bhola", "Pirojpur", "Patuakhali", "Barguna", "Jhalokati", "Bagerhat", "Pirojpur", "Bhola", "Patuakhali"]
        },
        {
          name: "Sylhet",
          code: "SY",
          cities: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj", "Netrokona", "Kishoreganj", "Brahmanbaria", "Comilla", "Chandpur", "Noakhali"]
        },
        {
          name: "Rangpur",
          code: "RP",
          cities: ["Rangpur", "Dinajpur", "Kurigram", "Gaibandha", "Nilphamari", "Panchagarh", "Thakurgaon", "Lalmonirhat", "Bogra", "Joypurhat"]
        },
        {
          name: "Mymensingh",
          code: "MY",
          cities: ["Mymensingh", "Jamalpur", "Sherpur", "Netrokona", "Kishoreganj", "Tangail", "Gazipur", "Dhaka", "Narayanganj", "Narsingdi"]
        }
      ]
    },
    {
      name: "Nepal",
      code: "NP",
      states: [
        {
          name: "Province 1",
          code: "P1",
          cities: ["Biratnagar", "Dharan", "Itahari", "Damak", "Bhadrapur", "Inaruwa", "Birtamod", "Dhankuta", "Ilam", "Phidim"]
        },
        {
          name: "Madhesh Province",
          code: "MP",
          cities: ["Janakpur", "Birgunj", "Kalaiya", "Jaleshwar", "Malangwa", "Rajbiraj", "Siraha", "Lahan", "Saptari", "Dhanusha"]
        },
        {
          name: "Bagmati Province",
          code: "BP",
          cities: ["Kathmandu", "Lalitpur", "Bhaktapur", "Hetauda", "Banepa", "Panauti", "Dhulikhel", "Kirtipur", "Madhyapur Thimi", "Bhaktapur"]
        },
        {
          name: "Gandaki Province",
          code: "GP",
          cities: ["Pokhara", "Bharatpur", "Gorkha", "Lumle", "Tansen", "Baglung", "Kusma", "Beni", "Myagdi", "Mustang"]
        },
        {
          name: "Lumbini Province",
          code: "LP",
          cities: ["Butwal", "Bhairahawa", "Tansen", "Gulariya", "Nepalgunj", "Dang", "Tulsipur", "Ghorahi", "Lamahi", "Tribhuvannagar"]
        },
        {
          name: "Karnali Province",
          code: "KP",
          cities: ["Birendranagar", "Surkhet", "Jumla", "Dolpa", "Jajarkot", "Kalikot", "Mugu", "Humla", "Dailekh", "Salyan"]
        },
        {
          name: "Sudurpashchim Province",
          code: "SP",
          cities: ["Dhangadhi", "Mahendranagar", "Tikapur", "Attariya", "Ghodaghodi", "Lamki", "Gulariya", "Bardiya", "Kailali", "Kanchanpur"]
        }
      ]
    },
    {
      name: "Other",
      code: "OT",
      states: [
        {
          name: "Other",
          code: "OT",
          cities: ["Other"]
        }
      ]
    }
  ]
};

// Helper functions
export const getCountries = () => locationData.countries.map(country => country.name);

export const getStates = (countryName: string) => {
  const country = locationData.countries.find(c => c.name === countryName);
  return country ? country.states.map(state => state.name) : [];
};

export const getCities = (countryName: string, stateName: string) => {
  const country = locationData.countries.find(c => c.name === countryName);
  if (!country) return [];
  
  const state = country.states.find(s => s.name === stateName);
  return state ? state.cities : [];
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!isValidEmail(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.org', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
    'throwaway.email', 'temp-mail.org', 'sharklasers.com', 'getairmail.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { isValid: false, message: 'Please use a valid email address (no temporary emails)' };
  }
  
  return { isValid: true, message: 'Valid email address' };
};
