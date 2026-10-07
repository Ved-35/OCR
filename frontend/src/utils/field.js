const AadharCard = [
  {
    "title": "NAME:",
    "status": 1,
    "created_at": "2026-07-09 12:38:34",
    "label_type": "free_text",
    "max_length": 0,
    "min_length": 0,
    "updated_at": "2026-07-09 12:38:34",
    "category_id": "[26,4]",
    "document_id": 51,
    "field_order": 1,
    "header_name": null,
    "is_required": 1,
    "placeholder": "NAME:",
    "category_name": "PROPERTY OWNER NAME, PERSONAL DOCUMENT",
    "dropdown_value": null,
    "sub_header_name": null,
    "validation_regex": "^[A-Za-z0-9]+$",
    "input_field_title": "6",
    "id_document_fields": 3822
  },
  {
    "title": "DOB:",
    "status": 1,
    "created_at": "2026-07-09 12:38:34",
    "label_type": "date",
    "max_length": 0,
    "min_length": 0,
    "updated_at": "2026-07-09 12:38:34",
    "category_id": "[4]",
    "document_id": 51,
    "field_order": 2,
    "header_name": null,
    "is_required": 1,
    "placeholder": "DD/MM/YYYY",
    "category_name": "PERSONAL DOCUMENT",
    "dropdown_value": null,
    "sub_header_name": null,
    "validation_regex": "^[A-Za-z0-9]+$",
    "input_field_title": "7",
    "id_document_fields": 3823
  },
  {
    "title": "ADHAAR CARD NUMBER",
    "status": 1,
    "created_at": "2026-07-09 12:38:34",
    "label_type": "numeric",
    "max_length": 0,
    "min_length": 0,
    "updated_at": "2026-07-09 12:38:34",
    "category_id": "[4]",
    "document_id": 51,
    "field_order": 3,
    "header_name": null,
    "is_required": 1,
    "placeholder": "ENTER ADHAAR NUMBER ",
    "category_name": "PERSONAL DOCUMENT",
    "dropdown_value": null,
    "sub_header_name": null,
    "validation_regex": "^[A-Za-z0-9]+$",
    "input_field_title": "8",
    "id_document_fields": 3824
  }
];

const PanCard = [
  {
    "id": 3829,
    "title": "PAN NUMBER",
    "type": "alphanumeric",
    "required": true,
    "placeholder": "ENTER PAN NUMBER",
    "minLength": 5,
    "maxLength": 10,
    "fieldOrder": 1,
    "category": "PERSONAL DOCUMENT"
  },
  {
    "id": 3830,
    "title": "NAME",
    "type": "alphanumeric",
    "required": true,
    "placeholder": "ENTER PAN NAME",
    "minLength": 5,
    "maxLength": 30,
    "fieldOrder": 2,
    "category": "FIRM NAME SCRUTINY, PERSONAL DOCUMENT"
  },
  {
    "id": 3831,
    "title": "DATE OF INCORPORATION",
    "type": "date",
    "required": true,
    "placeholder": "DD/MM/YYYY",
    "fieldOrder": 3,
    "category": "BUSINESS DOCUMENT"
  }
];

const ElectricityBill = [
  {
    "id": 3894,
    "title": "NAME",
    "type": "free_text",
    "required": true,
    "placeholder": "NAME:",
    "fieldOrder": 1,
    "category": "NAME, FULL NAME, BUSINESS DOCUMENT"
  },
  {
    "id": 3895,
    "title": "ADDRESS LINE-1",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER ADDRESS",
    "fieldOrder": 2,
    "category": "ADDRESS VERIFICATION"
  },
  {
    "id": 3896,
    "title": "ADDRESS LINE-2",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER ADDRESS",
    "fieldOrder": 3,
    "category": "ADDRESS VERIFICATION"
  },
  {
    "id": 3897,
    "title": "AREA",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT",
    "dropdown": "Area Code",
    "fieldOrder": 4,
    "category": "PINCODE, ADDRESS VERIFICATION"
  },
  {
    "id": 3898,
    "title": "CONSUMER NO.",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER CONSUMER NO.",
    "fieldOrder": 5,
    "category": "BUSINESS DOCUMENT, FIRM NAME SCRUTINY, ADDRESS VERIFICATION"
  },
  {
    "id": 3899,
    "title": "METER NO.",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER METER NO.",
    "fieldOrder": 6,
    "category": "BUSINESS DOCUMENT, FIRM NAME SCRUTINY, ADDRESS VERIFICATION"
  },
  {
    "id": 3900,
    "title": "SUB DIV. OFFICE",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT DIVISION",
    "dropdown": "Division",
    "fieldOrder": 7,
    "category": "BUSINESS DOCUMENT, FIRM NAME SCRUTINY, ADDRESS VERIFICATION"
  },
  {
    "id": 3901,
    "title": "CONNECTION TYPE",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT LT/HT",
    "dropdown": "Connection Type",
    "fieldOrder": 8,
    "category": "BUSINESS DOCUMENT, FIRM NAME SCRUTINY, ADDRESS VERIFICATION"
  },
  {
    "id": 3902,
    "title": "CONNECTED LOAD",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER CONNECTED LOAD",
    "fieldOrder": 9,
    "category": "BUSINESS DOCUMENT, FIRM NAME SCRUTINY, ADDRESS VERIFICATION"
  },
  {
    "id": 3903,
    "title": "ELECTRICITY COMPANY",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT",
    "dropdown": "Electricity Company",
    "fieldOrder": 10,
    "category": "ADDRESS VERIFICATION"
  }
];

const ProjectReport = [
  {
    "id": 1710,
    "title": "LAND",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 1,
    "header": "COST OF PROJECT",
    "subHeader": "FIXED ASSET"
  },
  {
    "id": 1711,
    "title": "PLANT AND MACHINERY",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 2,
    "header": "COST OF PROJECT",
    "subHeader": "FIXED ASSET"
  },
  {
    "id": 1712,
    "title": "BUILDING",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 3,
    "header": "COST OF PROJECT",
    "subHeader": "FIXED ASSET"
  },
  {
    "id": 1713,
    "title": "ELECTRICAL FITTING",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 4,
    "header": "COST OF PROJECT",
    "subHeader": "FIXED ASSET"
  },
  {
    "id": 1714,
    "title": "COMPRESSOR",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 5,
    "header": "COST OF PROJECT",
    "subHeader": "FIXED ASSET"
  },
  {
    "id": 1715,
    "title": "AIR CONDITIONER",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 6,
    "header": "COST OF PROJECT",
    "subHeader": "FIXED ASSET"
  },
  {
    "id": 1716,
    "title": "OTHER FIXED ASSET",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 7,
    "header": "COST OF PROJECT",
    "subHeader": "FIXED ASSET"
  },
  {
    "id": 1717,
    "title": "TOTAL ( A + B + C + D )",
    "type": "numeric",
    "required": true,
    "placeholder": "",
    "fieldOrder": 8,
    "header": "COST OF PROJECT",
    "subHeader": "TOTAL ( A + B + C + D )"
  },
  {
    "id": 1718,
    "title": "GOLD",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 9,
    "header": "COST OF PROJECT",
    "subHeader": "INVESTMENT"
  },
  {
    "id": 1719,
    "title": "SHARE",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 10,
    "header": "COST OF PROJECT",
    "subHeader": "INVESTMENT"
  },
  {
    "id": 1720,
    "title": "FIXED DEPOSITE",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 11,
    "header": "COST OF PROJECT",
    "subHeader": "INVESTMENT"
  },
  {
    "id": 1721,
    "title": "CURRENT ASSET",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 12,
    "header": "COST OF PROJECT",
    "subHeader": "TOTAL INVESTMENT ( B )"
  },
  {
    "id": 1722,
    "title": "SUNDRY DEBTOR",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 13,
    "header": "COST OF PROJECT",
    "subHeader": "TOTAL INVESTMENT ( B )"
  },
  {
    "id": 1723,
    "title": "STOCK",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 14,
    "header": "COST OF PROJECT",
    "subHeader": "TOTAL INVESTMENT ( B )"
  },
  {
    "id": 1724,
    "title": "CASH",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 15,
    "header": "COST OF PROJECT",
    "subHeader": "TOTAL INVESTMENT ( B )"
  },
  {
    "id": 1725,
    "title": "BANK",
    "type": "dropdown",
    "required": true,
    "placeholder": "",
    "dropdown": "Bank",
    "fieldOrder": 16,
    "header": "COST OF PROJECT",
    "subHeader": "TOTAL INVESTMENT ( B )"
  },
  {
    "id": 1726,
    "title": "OTHER CURRENT ASSET",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 17,
    "header": "COST OF PROJECT",
    "subHeader": "TOTAL INVESTMENT ( B )"
  },
  {
    "id": 1727,
    "title": "TOTAL CURRENT ASSET (C)",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 18,
    "header": "COST OF PROJECT",
    "subHeader": "TOTAL CURRENT ASSET ( C )"
  },
  {
    "id": 1728,
    "title": "GRAND TOTAL (A + B + C)",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 19,
    "header": "COST OF PROJECT",
    "subHeader": "GRAND TOTAL ( A + B + C )"
  }
];

const UdyamRegistrationCertificate = [
  {
    "id": 3926,
    "title": "UDYAM REGISTRATION NUMBER",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER UDYAM REGISTRATION NUMBER",
    "fieldOrder": 1,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3927,
    "title": "FIRM NAME",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER FIRM NAME",
    "fieldOrder": 2,
    "category": "FIRM NAME SCRUTINY, BUSINESS DOCUMENT"
  },
  {
    "id": 3928,
    "title": "NPV OF OLD MACHINERY IN UDYAM",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 3,
    "category": "BUSINESS DOCUMENT, MACHINERY DETAILS, PROFESSIONAL DOCUMENTATION, PERSONAL DOCUMENT"
  },
  {
    "id": 3929,
    "title": "DATE OF INCORPORATION",
    "type": "date",
    "required": true,
    "placeholder": "DD/MM/YYYY",
    "fieldOrder": 4,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3930,
    "title": "MOBILE NO.",
    "type": "numeric",
    "required": true,
    "placeholder": "ENTER MOBILE NUMBER",
    "fieldOrder": 5,
    "category": "MOBILE NUMBER, BUSINESS DOCUMENT"
  },
  {
    "id": 3931,
    "title": "EMAIL ID",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER EMAIL ID",
    "fieldOrder": 6,
    "category": "EMAILID, BUSINESS DOCUMENT"
  },
  {
    "id": 3932,
    "title": "PAN",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER PAN NUMBER",
    "minLength": 10,
    "maxLength": 10,
    "fieldOrder": 7,
    "category": "PAN NUMBER, BUSINESS DOCUMENT"
  },
  {
    "id": 3933,
    "title": "TYPE OF ORGANISATION",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT",
    "dropdown": "Constitution Type",
    "fieldOrder": 8,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3934,
    "title": "DATE OF UDYAM REGISTRATION",
    "type": "date",
    "required": true,
    "placeholder": "DD/MM/YYYY",
    "fieldOrder": 9,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3935,
    "title": "DATE OF COMMENCEMENT OF PRODUCTION",
    "type": "date",
    "required": true,
    "placeholder": "DD/MM/YYYY",
    "fieldOrder": 10,
    "category": "MACHINERY DETAILS, PROFESSIONAL DOCUMENTATION, PERSONAL DOCUMENT, BUSINESS DOCUMENT"
  },
  {
    "id": 3936,
    "title": "NIC CODE",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT",
    "dropdown": "NIC Code",
    "fieldOrder": 11,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3937,
    "title": "AREA",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT",
    "dropdown": "Area Code",
    "fieldOrder": 12,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3938,
    "title": "ADDRESS LINE-2",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER ADDRESS",
    "fieldOrder": 13,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3939,
    "title": "ADDRESS LINE-1",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER ADDRESS",
    "fieldOrder": 14,
    "category": "ADDRESS VERIFICATION, BUSINESS DOCUMENT"
  },
  {
    "id": 3940,
    "title": "CATEGORY ENTERPRISE",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT",
    "dropdown": "Category Owner",
    "fieldOrder": 15,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3941,
    "title": "MAJOR ACTIVITY",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT",
    "dropdown": "Activity",
    "fieldOrder": 16,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3942,
    "title": "TYPE OF ENTERPRISE",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT",
    "dropdown": "Category Enterprise",
    "fieldOrder": 17,
    "category": "BUSINESS DOCUMENT"
  }
];

const GSTCertificate = [
  {
    "id": 1749,
    "title": "GST REGISTRATION NUMBER",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "minLength": 0,
    "maxLength": 0,
    "fieldOrder": 1,
    "category": "BUSINESS DOCUMENT, PERSONAL DOCUMENT"
  },
  {
    "id": 1750,
    "title": "LEGAL NAME",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "minLength": 0,
    "maxLength": 0,
    "fieldOrder": 2,
    "category": "BUSINESS DOCUMENT, PERSONAL DOCUMENT"
  },
  {
    "id": 1751,
    "title": "TRADE NAME",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "minLength": 0,
    "maxLength": 0,
    "fieldOrder": 3,
    "category": "BUSINESS DOCUMENT, PERSONAL DOCUMENT"
  },
  {
    "id": 1752,
    "title": "CONSTITUTION",
    "type": "dropdown",
    "required": true,
    "placeholder": "",
    "dropdown": "Constitution Type",
    "fieldOrder": 4,
    "category": "BUSINESS DOCUMENT, PERSONAL DOCUMENT"
  },
  {
    "id": 1753,
    "title": "ADDRESS LINE - 1",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "minLength": 0,
    "maxLength": 0,
    "fieldOrder": 5,
    "category": "BUSINESS DOCUMENT, PERSONAL DOCUMENT"
  },
  {
    "id": 1754,
    "title": "DATE OF LIABILITY",
    "type": "date",
    "required": true,
    "placeholder": "",
    "fieldOrder": 6,
    "category": "BUSINESS DOCUMENT, PERSONAL DOCUMENT"
  },
  {
    "id": 1755,
    "title": "DATE OF ISSUE OF CERTIFICATE",
    "type": "date",
    "required": true,
    "placeholder": "",
    "fieldOrder": 7,
    "category": "BUSINESS DOCUMENT, PERSONAL DOCUMENT"
  },
  {
    "id": 1756,
    "title": "NAME",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "minLength": 0,
    "maxLength": 0,
    "fieldOrder": 8,
    "category": "BUSINESS DOCUMENT, PERSONAL DOCUMENT"
  },
  {
    "id": 1757,
    "title": "DESIGNATION",
    "type": "dropdown",
    "required": true,
    "placeholder": "",
    "dropdown": "Education",
    "fieldOrder": 9,
    "category": "BUSINESS DOCUMENT, PERSONAL DOCUMENT"
  }
];

const BirthCertificate = [
  {
    "id": 2027,
    "title": "FULL NAME",
    "type": "free_text",
    "required": true,
    "placeholder": "NAME:",
    "fieldOrder": 1,
    "category": "PERSONAL DOCUMENT"
  },
  {
    "id": 2028,
    "title": "DATE OF BIRTH",
    "type": "date",
    "required": true,
    "placeholder": "DD/MM/YYYY",
    "fieldOrder": 2,
    "category": "PERSONAL DOCUMENT"
  }
];

const LoanSanctionLetter = [
  {
    "id": 3385,
    "title": "LOAN SANCTION DATE",
    "type": "date",
    "required": true,
    "placeholder": "DD/MM/YYYY",
    "fieldOrder": 1,
    "category": "BUSINESS DOCUMENT, MATCH THE CRONOLOGY, MACHINERY DETAILS, PROFESSIONAL DOCUMENTATION, PERSONAL DOCUMENT"
  },
  {
    "id": 3386,
    "title": "LOAN APPLICATION DATE",
    "type": "date",
    "required": true,
    "placeholder": "DD/MM/YYYY",
    "fieldOrder": 2,
    "category": "MATCH THE CRONOLOGY"
  },
  {
    "id": 3387,
    "title": "FIRM NAME",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER FIRM NAME",
    "minLength": 2,
    "maxLength": 30,
    "fieldOrder": 3,
    "category": "BUSINESS DOCUMENT"
  },
  {
    "id": 3388,
    "title": "ADDRESS LINE 1",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER ADDRESS",
    "fieldOrder": 4,
    "category": ""
  },
  {
    "id": 3389,
    "title": "ADDRESS LINE 2",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER ADDRESS",
    "fieldOrder": 5,
    "category": ""
  },
  {
    "id": 3390,
    "title": "ADDRESS LINE 3",
    "type": "free_text",
    "required": true,
    "placeholder": "ENTER ADDRESS",
    "fieldOrder": 6,
    "category": ""
  },
  {
    "id": 3391,
    "title": "CITY / VILLAGE",
    "type": "dropdown",
    "required": true,
    "placeholder": "",
    "dropdown": "Village",
    "fieldOrder": 7,
    "category": ""
  },
  {
    "id": 3392,
    "title": "DISTRICT",
    "type": "dropdown",
    "required": true,
    "placeholder": "",
    "dropdown": "District",
    "fieldOrder": 8,
    "category": ""
  },
  {
    "id": 3393,
    "title": "AREA CODE",
    "type": "dropdown",
    "required": true,
    "placeholder": "",
    "dropdown": "Area Code",
    "fieldOrder": 9,
    "category": ""
  },
  {
    "id": 3394,
    "title": "LOAN AMOUNT",
    "type": "numeric",
    "required": true,
    "placeholder": "ENTER DATA",
    "fieldOrder": 10,
    "category": ""
  },
  {
    "id": 3395,
    "title": "MORATORIUM PERIOD",
    "type": "numeric",
    "required": true,
    "placeholder": "",
    "fieldOrder": 11,
    "category": ""
  },
  {
    "id": 3396,
    "title": "MARGIN",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 12,
    "category": ""
  },
  {
    "id": 3397,
    "title": "IS OLD MACHINERY LOAN SHOWN",
    "type": "free_text",
    "required": true,
    "placeholder": "",
    "fieldOrder": 13,
    "category": "BUSINESS DOCUMENT, MACHINERY DETAILS, PROFESSIONAL DOCUMENTATION, PERSONAL DOCUMENT"
  },
  {
    "id": 3398,
    "title": "LOAN SANCTION UNDER CGTMSE",
    "type": "free_text",
    "required": true,
    "placeholder": "YES / NO",
    "minLength": 2,
    "maxLength": 3,
    "fieldOrder": 14,
    "category": ""
  },
  {
    "id": 3399,
    "title": "RATE OF INTEREST",
    "type": "numeric",
    "required": true,
    "placeholder": "",
    "fieldOrder": 15,
    "category": ""
  },
  {
    "id": 3400,
    "title": "BANK",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT BANK",
    "dropdown": "Bank",
    "fieldOrder": 16,
    "category": ""
  },
  {
    "id": 3401,
    "title": "BRANCH",
    "type": "dropdown",
    "required": true,
    "placeholder": "SELECT BRANCH",
    "dropdown": "Branch",
    "fieldOrder": 17,
    "category": ""
  },
  {
    "id": 3402,
    "title": "LOAN REPAYMENT MONTH",
    "type": "numeric",
    "required": true,
    "placeholder": "",
    "fieldOrder": 18,
    "category": ""
  }
];

const BalanceSheetReport = [
  {
    "header_name": "LIABILITIES",
    "sub_header_name": "CAPITAL (A)",
    "fields": [
      "PROPRIETOR'S CAPITAL",
      "PARTNER/DIRECTOR-1 CAPITAL",
      "PARTNER/DIRECTOR-2 CAPITAL",
      "PARTNER/DIRECTOR-3 CAPITAL",
      "TOTAL"
    ]
  },
  {
    "header_name": "LIABILITIES",
    "sub_header_name": "SECURED LOAN (B)",
    "fields": [
      "TERM LOAN",
      "TOTAL"
    ]
  },
  {
    "header_name": "LIABILITIES",
    "sub_header_name": "RESERVE AND SURPLUS (D)",
    "fields": [
      "PERSONAL LOAN",
      "TOTAL"
    ]
  },
  {
    "header_name": "LIABILITIES",
    "sub_header_name": "CURRENT LIABILITY (E)",
    "fields": [
      "SUNDRY CREDITOR",
      "DUTY AND TAXES",
      "WORKING CAPITAL LOAN",
      "OVERDRAFT",
      "TOTAL"
    ]
  },
  {
    "header_name": "LIABILITIES",
    "sub_header_name": "TOTAL CURRENT LIABILITY",
    "fields": [
      "TOTAL CURRENT LIABILITY"
    ]
  },
  {
    "header_name": "ASSETS",
    "sub_header_name": "FIXED ASSET",
    "fields": [
      "LAND",
      "BUILDING",
      "PLANT AND MACHINERY",
      "ELECTRICAL FITTING",
      "FURNITURE & FIXTURES",
      "CAR & VEHICLE",
      "ELECTRONIC EQUIPMENT",
      "OTHER FIXED ASSET",
      "TOTAL FIXED ASSET (A)"
    ]
  },
  {
    "header_name": "ASSETS",
    "sub_header_name": "INVESTMENT",
    "fields": [
      "GOLD",
      "SHARE",
      "FIXED DEPOSIT",
      "OTHER INVESTMENT",
      "TOTAL INVESTMENT (B)"
    ]
  },
  {
    "header_name": "ASSETS",
    "sub_header_name": "TOTAL CURRENT ASSET (C)",
    "fields": [
      "CURRENT ASSET",
      "SUNDRY DEBTOR",
      "STOCK",
      "CASH",
      {
        "title": "BANK",
        "type": "dropdown",
        "dropdown_value": "Bank"
      },
      "TOTAL CURRENT ASSET (C)",
      "OTHER CURRENT ASSET",
      "GRAND TOTAL (A + B + C)"
    ]
  },
  {
    "header_name": "TOTAL OF LIABILITIES & ASSETS",
    "sub_header_name": "TOTAL",
    "fields": [
      "LIABILITIES TOTAL",
      "ASSETS TOTAL"
    ]
  }
];

export {
  AadharCard,
  PanCard,
  ElectricityBill,
  ProjectReport,
  UdyamRegistrationCertificate,
  GSTCertificate,
  BirthCertificate,
  LoanSanctionLetter,
  BalanceSheetReport
};
