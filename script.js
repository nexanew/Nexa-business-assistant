/* ============================================================
   NBA — Nexa Business Assistant
   Business Setup screen logic
   ============================================================
   This file:
   1. Fills in the dropdown lists (business type, country, state)
   2. Updates the live preview card as the user types
   3. Validates the form when "Create My Business" is pressed
   4. Saves the business to localStorage (no server, no database yet)
   5. Shows a success screen, and lets the user come back and edit
   ============================================================ */

// ---- 1. Reference data ----------------------------------------------------

const BUSINESS_TYPES = [
  "Provision / Grocery",
  "Pharmacy",
  "Food / Restaurant",
  "Plumbing / Hardware",
  "Clothing",
  "Electronics",
  "Supermarket",
  "Other"
];

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "Other"];

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
  "Federal Capital Territory (Abuja)"
];

const STORAGE_KEY = "nexaBusinessProfile";
const SALES_KEY = "nexaSales";
const INVENTORY_KEY = "nexaInventory";
const SUPPLIERS_KEY = "nexaSuppliers";
const PURCHASES_KEY = "nexaPurchases";
const SUPPLIER_PAYMENTS_KEY = "nexaSupplierPayments"; // reserved for a future "record payment" feature
const EXPENSES_KEY = "nexaExpenses";
const EXPENSE_COUNTER_KEY = "nexaExpenseCounter"; // only ever increases, so expense numbers stay unique even after deletes
const DRAWINGS_KEY = "nexaDrawings";
const DRAWING_COUNTER_KEY = "nexaDrawingCounter"; // only ever increases, so drawing numbers stay unique even after deletes
const CUSTOMERS_KEY = "nexaCustomers";
const CUSTOMER_PAYMENTS_KEY = "nexaCustomerPayments";
const RECEIPT_NUMBERS_KEY = "nexaReceiptNumbers"; // saleId -> "NBA-000001", assigned once on first view, never reused
const RECEIPT_COUNTER_KEY = "nexaReceiptCounter";
const SETTINGS_KEY = "nexaSettings"; // Module 20 — configuration/display preferences only, never financial data
const INVENTORY_ADJUSTMENTS_KEY = "nexaInventoryAdjustments"; // Module 21 — manual stock adjustments, separate from Purchases/Sales
const ADJUSTMENT_COUNTER_KEY = "nexaAdjustmentCounter"; // only ever increases, so adjustment numbers stay unique even after reversal
const MONEY_TRANSFERS_KEY = "nexaMoneyTransfers"; // Module 22 — internal Cash <-> Bank transfers, separate from Sales/Purchases/Expenses
const TRANSFER_COUNTER_KEY = "nexaTransferCounter"; // only ever increases, so transfer numbers stay unique even after reversal

// ---- 2. Element references -------------------------------------------------

const form = document.getElementById("businessForm");
const successPanel = document.getElementById("successPanel");
const editBtn = document.getElementById("editBtn");
const formErrorSummary = document.getElementById("formErrorSummary");

const fields = {
  businessName: document.getElementById("businessName"),
  businessType: document.getElementById("businessType"),
  country: document.getElementById("country"),
  state: document.getElementById("state"),
  address: document.getElementById("address"),
  ownerName: document.getElementById("ownerName"),
  phone: document.getElementById("phone"),
  email: document.getElementById("email"),
  cash: document.getElementById("cash"),
  bank: document.getElementById("bank"),
  stock: document.getElementById("stock")
};

const setupView = document.getElementById("setupView");
const dashboardView = document.getElementById("dashboardView");
const goDashboardBtn = document.getElementById("goDashboardBtn");
const dashNav = document.getElementById("dashNav");
const dashSectionDashboard = document.getElementById("dashSection-dashboard");
const dashSectionSales = document.getElementById("dashSection-sales");
const dashSectionInventory = document.getElementById("dashSection-inventory");
const dashSectionPurchases = document.getElementById("dashSection-purchases");
const dashSectionSuppliers = document.getElementById("dashSection-suppliers");
const dashSectionExpenses = document.getElementById("dashSection-expenses");
const dashSectionDrawings = document.getElementById("dashSection-drawings");
const dashSectionTransfers = document.getElementById("dashSection-transfers");
const dashSectionCustomers = document.getElementById("dashSection-customers");
const dashSectionReports = document.getElementById("dashSection-reports");
const dashSectionSettings = document.getElementById("dashSection-settings");
const dashSectionAlerts = document.getElementById("dashSection-alerts");
const dashSectionAI = document.getElementById("dashSection-ai");
const dashSectionComingSoon = document.getElementById("dashSection-comingsoon");
const comingSoonTitle = document.getElementById("comingSoonTitle");
const comingSoonText = document.getElementById("comingSoonText");
const settingsEditBtn = document.getElementById("settingsEditBtn");
const settingsSummaryGrid = document.getElementById("settingsSummaryGrid");

// ---- Module 18: Alerts elements ----
const navAlertsBtn = document.getElementById("navAlertsBtn");
const alertsListContainer = document.getElementById("alertsListContainer");

// ---- Module 21: AI Business Assistant (V1 — read-only) elements ----
const aiChatLog = document.getElementById("aiChatLog");
const aiChatForm = document.getElementById("aiChatForm");
const aiChatInput = document.getElementById("aiChatInput");
const aiSuggestions = document.getElementById("aiSuggestions");

// ---- Module 19: Global Search elements ----
const globalSearchInput = document.getElementById("globalSearchInput");
const globalSearchClearBtn = document.getElementById("globalSearchClearBtn");
const globalSearchResults = document.getElementById("globalSearchResults");

// ---- Module 20: Settings elements ----
const settingsCurrencySymbol = document.getElementById("settingsCurrencySymbol");
const settingsDateFormat = document.getElementById("settingsDateFormat");
const settingsDefaultPaymentMethod = document.getElementById("settingsDefaultPaymentMethod");
const settingsLowStockThreshold = document.getElementById("settingsLowStockThreshold");
const settingsReceiptHeaderName = document.getElementById("settingsReceiptHeaderName");
const settingsReceiptPhone = document.getElementById("settingsReceiptPhone");
const settingsReceiptAddress = document.getElementById("settingsReceiptAddress");
const settingsReceiptFooter = document.getElementById("settingsReceiptFooter");
const settingsAlertLowStock = document.getElementById("settingsAlertLowStock");
const settingsAlertCustomerDebt = document.getElementById("settingsAlertCustomerDebt");
const settingsAlertSupplierPayable = document.getElementById("settingsAlertSupplierPayable");
const settingsAlertNoSales = document.getElementById("settingsAlertNoSales");
const settingsAlertExpenseSummary = document.getElementById("settingsAlertExpenseSummary");
const settingsAlertBackupReminder = document.getElementById("settingsAlertBackupReminder");
const settingsVoiceAssistantEnabled = document.getElementById("settingsVoiceAssistantEnabled");
const savePreferencesBtn = document.getElementById("savePreferencesBtn");
const saveInventorySettingsBtn = document.getElementById("saveInventorySettingsBtn");
const saveReceiptSettingsBtn = document.getElementById("saveReceiptSettingsBtn");
const settingsSavedMsg = document.getElementById("settingsSavedMsg");

const backupSummaryGrid = document.getElementById("backupSummaryGrid");
const backupNowBtn = document.getElementById("backupNowBtn");
const backupSuccessMsg = document.getElementById("backupSuccessMsg");
const backupLastInfo = document.getElementById("backupLastInfo");
const restoreFileInput = document.getElementById("restoreFileInput");
const restoreErrorMsg = document.getElementById("restoreErrorMsg");
const restoreConfirmOverlay = document.getElementById("restoreConfirmOverlay");
const restoreConfirmBusinessName = document.getElementById("restoreConfirmBusinessName");
const restoreConfirmDate = document.getElementById("restoreConfirmDate");
const restoreConfirmGrid = document.getElementById("restoreConfirmGrid");
const cancelRestoreBtn = document.getElementById("cancelRestoreBtn");
const backupThenRestoreBtn = document.getElementById("backupThenRestoreBtn");
const confirmRestoreBtn = document.getElementById("confirmRestoreBtn");

const salesTodaySummary = document.getElementById("salesTodaySummary");
const newSaleBtn = document.getElementById("newSaleBtn");
const saleFormCard = document.getElementById("saleFormCard");
const saleItemRows = document.getElementById("saleItemRows");
const itemProductSelect = document.getElementById("itemProductSelect");
const customItemName = document.getElementById("customItemName");
const itemStockHint = document.getElementById("itemStockHint");
const newItemQty = document.getElementById("newItemQty");
const newItemPrice = document.getElementById("newItemPrice");
const addItemBtn = document.getElementById("addItemBtn");
const saleTotalValue = document.getElementById("saleTotalValue");
const salePaymentType = document.getElementById("salePaymentType");
const saleCustomerField = document.getElementById("saleCustomerField");
const saleCustomerSelect = document.getElementById("saleCustomerSelect");
const saleCustomerHint = document.getElementById("saleCustomerHint");
const salePaymentMethodField = document.getElementById("salePaymentMethodField");
const paymentMethod = document.getElementById("paymentMethod");
const saleFormError = document.getElementById("saleFormError");
const cancelSaleBtn = document.getElementById("cancelSaleBtn");
const saveSaleBtn = document.getElementById("saveSaleBtn");
const salesList = document.getElementById("salesList");

const receiptOverlay = document.getElementById("receiptOverlay");
const receiptPaper = document.getElementById("receiptPaper");
const receiptSuccessBanner = document.getElementById("receiptSuccessBanner");
const receiptCloseIconBtn = document.getElementById("receiptCloseIconBtn");
const receiptCloseBtn = document.getElementById("receiptCloseBtn");
const receiptNewSaleBtn = document.getElementById("receiptNewSaleBtn");
const receiptPrintBtn = document.getElementById("receiptPrintBtn");

const inventoryValueSummary = document.getElementById("inventoryValueSummary");
const newProductBtn = document.getElementById("newProductBtn");
const productFormCard = document.getElementById("productFormCard");
const productName = document.getElementById("productName");
const productCost = document.getElementById("productCost");
const productPrice = document.getElementById("productPrice");
const productQty = document.getElementById("productQty");
const productFormError = document.getElementById("productFormError");
const cancelProductBtn = document.getElementById("cancelProductBtn");
const saveProductBtn = document.getElementById("saveProductBtn");
const productList = document.getElementById("productList");
const addStockFormCard = document.getElementById("addStockFormCard");
const addStockProductName = document.getElementById("addStockProductName");
const addStockType = document.getElementById("addStockType");
const addStockQty = document.getElementById("addStockQty");
const addStockReason = document.getElementById("addStockReason");
const addStockNote = document.getElementById("addStockNote");
const addStockFormError = document.getElementById("addStockFormError");
const cancelAddStockBtn = document.getElementById("cancelAddStockBtn");
const saveAddStockBtn = document.getElementById("saveAddStockBtn");
const stockAdjustmentList = document.getElementById("stockAdjustmentList");

const transfersStatTotal = document.getElementById("transfersStatTotal");
const transfersStatCashToBank = document.getElementById("transfersStatCashToBank");
const transfersStatBankToCash = document.getElementById("transfersStatBankToCash");
const newTransferBtn = document.getElementById("newTransferBtn");
const transferFormCard = document.getElementById("transferFormCard");
const transferDate = document.getElementById("transferDate");
const transferDirection = document.getElementById("transferDirection");
const transferAmount = document.getElementById("transferAmount");
const transferNote = document.getElementById("transferNote");
const transferFormError = document.getElementById("transferFormError");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const saveTransferBtn = document.getElementById("saveTransferBtn");
const transferList = document.getElementById("transferList");

const purchasesTodaySummary = document.getElementById("purchasesTodaySummary");
const newPurchaseBtn = document.getElementById("newPurchaseBtn");
const purchaseFormCard = document.getElementById("purchaseFormCard");
const purchasePrereqMessage = document.getElementById("purchasePrereqMessage");
const purchasePrereqText = document.getElementById("purchasePrereqText");
const purchasePrereqBtn = document.getElementById("purchasePrereqBtn");
const purchaseFormBody = document.getElementById("purchaseFormBody");
const purchaseSupplierSelect = document.getElementById("purchaseSupplierSelect");
const purchaseItemRows = document.getElementById("purchaseItemRows");
const purchaseProductSelect = document.getElementById("purchaseProductSelect");
const purchaseItemQty = document.getElementById("purchaseItemQty");
const purchaseItemCost = document.getElementById("purchaseItemCost");
const purchaseAddItemBtn = document.getElementById("purchaseAddItemBtn");
const purchaseTotalValue = document.getElementById("purchaseTotalValue");
const purchasePaymentMethod = document.getElementById("purchasePaymentMethod");
const purchaseNotes = document.getElementById("purchaseNotes");
const purchaseFormError = document.getElementById("purchaseFormError");
const cancelPurchaseBtn = document.getElementById("cancelPurchaseBtn");
const savePurchaseBtn = document.getElementById("savePurchaseBtn");
const purchaseNewSupplierBtn = document.getElementById("purchaseNewSupplierBtn");
const purchaseNewProductBtn = document.getElementById("purchaseNewProductBtn");

// Purchase: quick-create supplier modal
const purchaseQuickSupplierOverlay = document.getElementById("purchaseQuickSupplierOverlay");
const purchaseQuickSupplierCloseBtn = document.getElementById("purchaseQuickSupplierCloseBtn");
const pqSupplierName = document.getElementById("pqSupplierName");
const pqSupplierPhone = document.getElementById("pqSupplierPhone");
const pqSupplierEmail = document.getElementById("pqSupplierEmail");
const pqSupplierAddress = document.getElementById("pqSupplierAddress");
const pqSupplierNotes = document.getElementById("pqSupplierNotes");
const pqSupplierFormError = document.getElementById("pqSupplierFormError");
const pqSupplierDuplicateBox = document.getElementById("pqSupplierDuplicateBox");
const pqSupplierDuplicateText = document.getElementById("pqSupplierDuplicateText");
const pqSupplierMainActions = document.getElementById("pqSupplierMainActions");
const pqSupplierUseExistingBtn = document.getElementById("pqSupplierUseExistingBtn");
const pqSupplierCreateAnywayBtn = document.getElementById("pqSupplierCreateAnywayBtn");
const pqSupplierCancelBtn = document.getElementById("pqSupplierCancelBtn");
const pqSupplierCreateBtn = document.getElementById("pqSupplierCreateBtn");

// Purchase: quick-create product modal
const purchaseQuickProductOverlay = document.getElementById("purchaseQuickProductOverlay");
const purchaseQuickProductCloseBtn = document.getElementById("purchaseQuickProductCloseBtn");
const pqProductName = document.getElementById("pqProductName");
const pqProductCost = document.getElementById("pqProductCost");
const pqProductPrice = document.getElementById("pqProductPrice");
const pqProductQty = document.getElementById("pqProductQty");
const pqProductFormError = document.getElementById("pqProductFormError");
const pqProductDuplicateBox = document.getElementById("pqProductDuplicateBox");
const pqProductDuplicateText = document.getElementById("pqProductDuplicateText");
const pqProductMainActions = document.getElementById("pqProductMainActions");
const pqProductUseExistingBtn = document.getElementById("pqProductUseExistingBtn");
const pqProductCreateAnywayBtn = document.getElementById("pqProductCreateAnywayBtn");
const pqProductCancelBtn = document.getElementById("pqProductCancelBtn");
const pqProductCreateBtn = document.getElementById("pqProductCreateBtn");

// Purchase confirmation modal
const purchaseConfirmOverlay = document.getElementById("purchaseConfirmOverlay");
const purchaseConfirmSupplier = document.getElementById("purchaseConfirmSupplier");
const purchaseConfirmItems = document.getElementById("purchaseConfirmItems");
const purchaseConfirmTotal = document.getElementById("purchaseConfirmTotal");
const purchaseConfirmPayment = document.getElementById("purchaseConfirmPayment");
const purchaseConfirmCancelBtn = document.getElementById("purchaseConfirmCancelBtn");
const purchaseConfirmSaveBtn = document.getElementById("purchaseConfirmSaveBtn");
const purchaseList = document.getElementById("purchaseList");

const expensesTodaySummary = document.getElementById("expensesTodaySummary");
const newExpenseBtn = document.getElementById("newExpenseBtn");
const expenseFormCard = document.getElementById("expenseFormCard");
const expenseFormTitle = document.getElementById("expenseFormTitle");
const expenseDate = document.getElementById("expenseDate");
const expenseCategory = document.getElementById("expenseCategory");
const expenseDescription = document.getElementById("expenseDescription");
const expenseAmount = document.getElementById("expenseAmount");
const expensePaymentMethod = document.getElementById("expensePaymentMethod");
const expenseNote = document.getElementById("expenseNote");
const expenseFormError = document.getElementById("expenseFormError");
const cancelExpenseBtn = document.getElementById("cancelExpenseBtn");
const saveExpenseBtn = document.getElementById("saveExpenseBtn");
const expenseList = document.getElementById("expenseList");

const drawingsTodaySummary = document.getElementById("drawingsTodaySummary");
const drawingsStatTotal = document.getElementById("drawingsStatTotal");
const drawingsStatCash = document.getElementById("drawingsStatCash");
const drawingsStatBank = document.getElementById("drawingsStatBank");
const newDrawingBtn = document.getElementById("newDrawingBtn");
const drawingFormCard = document.getElementById("drawingFormCard");
const drawingFormTitle = document.getElementById("drawingFormTitle");
const drawingDate = document.getElementById("drawingDate");
const drawingReason = document.getElementById("drawingReason");
const drawingDescription = document.getElementById("drawingDescription");
const drawingAmount = document.getElementById("drawingAmount");
const drawingPaymentMethod = document.getElementById("drawingPaymentMethod");
const drawingNote = document.getElementById("drawingNote");
const drawingFormError = document.getElementById("drawingFormError");
const cancelDrawingBtn = document.getElementById("cancelDrawingBtn");
const saveDrawingBtn = document.getElementById("saveDrawingBtn");
const drawingList = document.getElementById("drawingList");

const suppliersListView = document.getElementById("suppliersListView");
const suppliersSummary = document.getElementById("suppliersSummary");
const newSupplierBtn = document.getElementById("newSupplierBtn");
const supplierFormCard = document.getElementById("supplierFormCard");
const supplierName = document.getElementById("supplierName");
const supplierPhone = document.getElementById("supplierPhone");
const supplierEmail = document.getElementById("supplierEmail");
const supplierAddress = document.getElementById("supplierAddress");
const supplierNotes = document.getElementById("supplierNotes");
const supplierFormError = document.getElementById("supplierFormError");
const cancelSupplierBtn = document.getElementById("cancelSupplierBtn");
const saveSupplierBtn = document.getElementById("saveSupplierBtn");
const supplierList = document.getElementById("supplierList");

const supplierDetailView = document.getElementById("supplierDetailView");
const backToSuppliersBtn = document.getElementById("backToSuppliersBtn");
const supplierDetailName = document.getElementById("supplierDetailName");
const supplierDetailContact = document.getElementById("supplierDetailContact");
const supplierStatTotal = document.getElementById("supplierStatTotal");
const supplierStatPaid = document.getElementById("supplierStatPaid");
const supplierStatOwed = document.getElementById("supplierStatOwed");
const supplierStatement = document.getElementById("supplierStatement");
const newSupplierPaymentBtn = document.getElementById("newSupplierPaymentBtn");
const supplierPaymentFormCard = document.getElementById("supplierPaymentFormCard");
const paymentSupplierName = document.getElementById("paymentSupplierName");
const supplierPaymentDate = document.getElementById("supplierPaymentDate");
const supplierPaymentAmount = document.getElementById("supplierPaymentAmount");
const supplierPaymentMethod = document.getElementById("supplierPaymentMethod");
const supplierPaymentNote = document.getElementById("supplierPaymentNote");
const supplierPaymentFormError = document.getElementById("supplierPaymentFormError");
const cancelSupplierPaymentBtn = document.getElementById("cancelSupplierPaymentBtn");
const saveSupplierPaymentBtn = document.getElementById("saveSupplierPaymentBtn");

const customersListView = document.getElementById("customersListView");
const customersSummary = document.getElementById("customersSummary");
const newCustomerBtn = document.getElementById("newCustomerBtn");
const customerFormCard = document.getElementById("customerFormCard");
const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const customerEmail = document.getElementById("customerEmail");
const customerAddress = document.getElementById("customerAddress");
const customerNotes = document.getElementById("customerNotes");
const customerFormError = document.getElementById("customerFormError");
const cancelCustomerBtn = document.getElementById("cancelCustomerBtn");
const saveCustomerBtn = document.getElementById("saveCustomerBtn");
const customerList = document.getElementById("customerList");

const customerDetailView = document.getElementById("customerDetailView");
const backToCustomersBtn = document.getElementById("backToCustomersBtn");
const customerDetailName = document.getElementById("customerDetailName");
const customerDetailContact = document.getElementById("customerDetailContact");
const customerStatTotal = document.getElementById("customerStatTotal");
const customerStatPaid = document.getElementById("customerStatPaid");
const customerStatOwed = document.getElementById("customerStatOwed");
const customerStatement = document.getElementById("customerStatement");
const newCustomerPaymentBtn = document.getElementById("newCustomerPaymentBtn");
const customerPaymentFormCard = document.getElementById("customerPaymentFormCard");
const paymentCustomerName = document.getElementById("paymentCustomerName");
const customerPaymentDate = document.getElementById("customerPaymentDate");
const customerPaymentAmount = document.getElementById("customerPaymentAmount");
const customerPaymentMethod = document.getElementById("customerPaymentMethod");
const customerPaymentNote = document.getElementById("customerPaymentNote");
const customerPaymentFormError = document.getElementById("customerPaymentFormError");
const cancelCustomerPaymentBtn = document.getElementById("cancelCustomerPaymentBtn");
const saveCustomerPaymentBtn = document.getElementById("saveCustomerPaymentBtn");

const reportsRangeLabel = document.getElementById("reportsRangeLabel");
const printReportBtn = document.getElementById("printReportBtn");
const reportRangePills = document.getElementById("reportRangePills");
const reportCustomRange = document.getElementById("reportCustomRange");
const reportFromDate = document.getElementById("reportFromDate");
const reportToDate = document.getElementById("reportToDate");
const applyCustomRangeBtn = document.getElementById("applyCustomRangeBtn");
const reportPrintBusinessName = document.getElementById("reportPrintBusinessName");
const reportPrintRangeLabel = document.getElementById("reportPrintRangeLabel");
const reportFinancialSummaryGrid = document.getElementById("reportFinancialSummaryGrid");
const reportSalesGrid = document.getElementById("reportSalesGrid");
const reportPurchasesGrid = document.getElementById("reportPurchasesGrid");
const reportProfitGrid = document.getElementById("reportProfitGrid");
const reportExpensesSummaryGrid = document.getElementById("reportExpensesSummaryGrid");
const reportExpensesByCategory = document.getElementById("reportExpensesByCategory");
const reportReceivablesGrid = document.getElementById("reportReceivablesGrid");
const reportReceivablesList = document.getElementById("reportReceivablesList");
const reportPayablesGrid = document.getElementById("reportPayablesGrid");
const reportPayablesList = document.getElementById("reportPayablesList");
const reportDrawingsGrid = document.getElementById("reportDrawingsGrid");
const reportDrawingsByReason = document.getElementById("reportDrawingsByReason");
const reportInventoryGrid = document.getElementById("reportInventoryGrid");
const reportLowStockThresholdLabel = document.getElementById("reportLowStockThresholdLabel");
const reportLowStockList = document.getElementById("reportLowStockList");
const reportAdjustmentsGrid = document.getElementById("reportAdjustmentsGrid");
const reportTransfersGrid = document.getElementById("reportTransfersGrid");
const reportPaymentMethodsTables = document.getElementById("reportPaymentMethodsTables");
const reportTopProducts = document.getElementById("reportTopProducts");
const reportSalesTrend = document.getElementById("reportSalesTrend");

const dash = {
  greeting: document.getElementById("dashGreeting"),
  businessName: document.getElementById("dashBusinessName"),
  businessMeta: document.getElementById("dashBusinessMeta"),
  statCash: document.getElementById("statCash"),
  statBank: document.getElementById("statBank"),
  statStock: document.getElementById("statStock"),
  statReceivables: document.getElementById("statReceivables"),
  statPayables: document.getElementById("statPayables"),
  statDrawings: document.getElementById("statDrawings"),
  statTotal: document.getElementById("statTotal"),
  statSales: document.getElementById("statSales"),
  statGrossProfit: document.getElementById("statGrossProfit"),
  statExpenses: document.getElementById("statExpenses"),
  statNetProfit: document.getElementById("statNetProfit"),
  statTransactions: document.getElementById("statTransactions")
};

const dashTodayDate = document.getElementById("dashTodayDate");
const dashPeriodPills = document.getElementById("dashPeriodPills");
const dashPeriodTitle = document.getElementById("dashPeriodTitle");
const dashTopProductsList = document.getElementById("dashTopProductsList");
const dashSalesTrendChart = document.getElementById("dashSalesTrendChart");
const dashPaymentMethodsGrid = document.getElementById("dashPaymentMethodsGrid");
const dashLowStockList = document.getElementById("dashLowStockList");
const dashRecentSalesList = document.getElementById("dashRecentSalesList");
const dashAlertsList = document.getElementById("dashAlertsList");
const dashBackupInfo = document.getElementById("dashBackupInfo");
const dashBackupBtn = document.getElementById("dashBackupBtn");
const dashViewReportsBtn = document.getElementById("dashViewReportsBtn");

// Text shown on the placeholder "coming soon" sections for each nav item
const COMING_SOON_TEXT = {};

const preview = {
  status: document.getElementById("previewStatusLabel"),
  badge: document.getElementById("previewBadge"),
  name: document.getElementById("previewName"),
  type: document.getElementById("previewType"),
  location: document.getElementById("previewLocation"),
  owner: document.getElementById("previewOwner"),
  phone: document.getElementById("previewPhone"),
  cash: document.getElementById("previewCash"),
  bank: document.getElementById("previewBank"),
  stock: document.getElementById("previewStock")
};

// ---- 3. Populate dropdowns -------------------------------------------------

function fillSelect(selectEl, values, keepFirstOption) {
  values.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    selectEl.appendChild(opt);
  });
}

fillSelect(fields.businessType, BUSINESS_TYPES);
fillSelect(fields.country, COUNTRIES);
fillSelect(fields.state, NIGERIAN_STATES);

// Country defaults to Nigeria
fields.country.value = "Nigeria";

// ---- 4. Helpers -------------------------------------------------------------

function formatNaira(value) {
  const num = Number(value) || 0;
  const sign = num < 0 ? "-" : "";
  const symbol = loadSettings().currencySymbol || "₦";
  return sign + symbol + Math.abs(num).toLocaleString("en-NG");
}

// ---- Date helpers used by Expenses (kept separate from isToday(), which
// works off full timestamps — expense dates are plain "YYYY-MM-DD" values
// picked by the owner, so they're compared as calendar dates directly). ----

function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayDateValue() {
  return toDateInputValue(new Date());
}

function isExpenseToday(expense) {
  return expense.date === todayDateValue();
}

function isDrawingToday(drawing) {
  return drawing.date === todayDateValue();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidNigerianPhone(value) {
  const cleaned = value.replace(/[\s-]/g, "");
  return /^(\+234[7-9]\d{9}|0[7-9]\d{9})$/.test(cleaned);
}

// ---- 5. Live preview updating ----------------------------------------------

function updatePreview() {
  preview.name.textContent = fields.businessName.value.trim() || "Your business name";
  preview.type.textContent = fields.businessType.value || "Business type";

  const state = fields.state.value;
  const country = fields.country.value || "Nigeria";
  preview.location.textContent = state ? `${state}, ${country}` : country;

  preview.owner.textContent = fields.ownerName.value.trim() || "—";
  preview.phone.textContent = fields.phone.value.trim() || "—";

  preview.cash.textContent = formatNaira(fields.cash.value);
  preview.bank.textContent = formatNaira(fields.bank.value);
  preview.stock.textContent = formatNaira(fields.stock.value);
}

Object.values(fields).forEach((el) => {
  el.addEventListener("input", updatePreview);
  el.addEventListener("change", updatePreview);
});

// ---- 6. Validation ----------------------------------------------------------

function setFieldError(name, message) {
  const inputEl = fields[name];
  const errorEl = document.getElementById("err-" + name);
  const wrapper = inputEl.closest(".field");

  if (message) {
    wrapper.classList.add("has-error");
    errorEl.textContent = message;
    inputEl.setAttribute("aria-invalid", "true");
  } else {
    wrapper.classList.remove("has-error");
    errorEl.textContent = "";
    inputEl.removeAttribute("aria-invalid");
  }
}

function validateForm() {
  let firstInvalid = null;
  const errors = [];

  function fail(name, message) {
    setFieldError(name, message);
    errors.push(message);
    if (!firstInvalid) firstInvalid = fields[name];
  }

  // Business name
  if (!fields.businessName.value.trim()) {
    fail("businessName", "Enter your business name.");
  } else {
    setFieldError("businessName", null);
  }

  // Business type
  if (!fields.businessType.value) {
    fail("businessType", "Select a business type.");
  } else {
    setFieldError("businessType", null);
  }

  // State
  if (!fields.state.value) {
    fail("state", "Select a state.");
  } else {
    setFieldError("state", null);
  }

  // Owner name
  if (!fields.ownerName.value.trim()) {
    fail("ownerName", "Enter the owner's name.");
  } else {
    setFieldError("ownerName", null);
  }

  // Phone
  const phoneVal = fields.phone.value.trim();
  if (!phoneVal) {
    fail("phone", "Enter a phone number.");
  } else if (!isValidNigerianPhone(phoneVal)) {
    fail("phone", "Enter a valid phone number, e.g. 08031234567.");
  } else {
    setFieldError("phone", null);
  }

  // Email (optional, but must be valid if filled in)
  const emailVal = fields.email.value.trim();
  if (emailVal && !isValidEmail(emailVal)) {
    fail("email", "Enter a valid email address.");
  } else {
    setFieldError("email", null);
  }

  return { valid: errors.length === 0, firstInvalid, count: errors.length };
}

// ---- 7. Save / load from localStorage ---------------------------------------

function collectFormData() {
  return {
    businessName: fields.businessName.value.trim(),
    businessType: fields.businessType.value,
    country: fields.country.value,
    state: fields.state.value,
    address: fields.address.value.trim(),
    ownerName: fields.ownerName.value.trim(),
    phone: fields.phone.value.trim(),
    email: fields.email.value.trim(),
    cash: Number(fields.cash.value) || 0,
    bank: Number(fields.bank.value) || 0,
    stock: Number(fields.stock.value) || 0,
    createdAt: new Date().toISOString()
  };
}

function saveBusiness(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadBusiness() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// ---- 7a2. Settings storage (Module 20) ---------------------------------------
// Configuration/display preferences only. Never touches sales, purchases,
// inventory quantities, customer/supplier balances, expenses, drawings or
// historical profit — those all keep using their own existing storage keys
// and calculation functions untouched.

const DEFAULT_SETTINGS = {
  currencySymbol: "₦",
  dateFormat: "d-mmm-yyyy", // also: "dd/mm/yyyy", "mm/dd/yyyy"
  defaultPaymentMethod: "",
  lowStockThreshold: 5,
  receiptHeaderName: "",
  receiptPhone: "",
  receiptAddress: "",
  receiptFooter: "Thank you for your business.",
  voiceAssistantEnabled: true, // Voice Assistant V1 — only controls whether the mic button shows; it never enables background listening
  alerts: {
    lowStock: true,
    customerDebt: true,
    supplierPayable: true,
    noSales: true,
    expenseSummary: true,
    backupReminder: true
  }
};

let cachedSettings = null; // invalidated on save so alerts/search/receipts/etc. never read stale settings

function loadSettings() {
  if (cachedSettings) return cachedSettings;
  const raw = localStorage.getItem(SETTINGS_KEY);
  let parsed = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw) || {};
    } catch (e) {
      parsed = {};
    }
  }
  cachedSettings = Object.assign({}, DEFAULT_SETTINGS, parsed, {
    alerts: Object.assign({}, DEFAULT_SETTINGS.alerts, parsed.alerts || {})
  });
  return cachedSettings;
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  cachedSettings = null;
}

function getLowStockThreshold() {
  const n = Number(loadSettings().lowStockThreshold);
  return Number.isFinite(n) && n >= 0 ? n : 5;
}

// ---- 7b. Sales storage -------------------------------------------------------

function loadSales() {
  const raw = localStorage.getItem(SALES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveSales(sales) {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

function isToday(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function addSale(sale) {
  const sales = loadSales();
  sales.push(sale);
  saveSales(sales);

  // A Credit sale earns revenue and profit immediately, but no money has
  // been received yet — so it does NOT touch Cash or Bank. Instead it
  // becomes a charge against the customer, read live off Sales + Payments
  // (see getCustomerStats) rather than a separately-mutated balance.
  // A Paid sale keeps the exact original behavior.
  if (sale.paymentType !== "Credit") {
    const business = loadBusiness();
    if (business) {
      if (sale.paymentMethod === "Cash") {
        business.cash = (Number(business.cash) || 0) + sale.total;
      } else {
        business.bank = (Number(business.bank) || 0) + sale.total;
      }
      saveBusiness(business);
    }
  }

  // Reduce stock for any items that came from Inventory (custom items have
  // no productId). This happens the same way for Paid and Credit sales.
  const products = loadInventory();
  let inventoryChanged = false;
  sale.items.forEach((item) => {
    if (!item.productId) return;
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      product.quantity = Math.max(0, (Number(product.quantity) || 0) - item.qty);
      inventoryChanged = true;
    }
  });
  if (inventoryChanged) {
    saveInventory(products);
  }
}

// ---- 7c. Inventory storage ----------------------------------------------------

function loadInventory() {
  const raw = localStorage.getItem(INVENTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveInventory(products) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(products));
}

function addProduct(product) {
  const products = loadInventory();
  products.push(product);
  saveInventory(products);
}

function addStockToProduct(id, qtyToAdd) {
  const products = loadInventory();
  const product = products.find((p) => p.id === id);
  if (product) {
    product.quantity = (Number(product.quantity) || 0) + qtyToAdd;
    saveInventory(products);
  }
}

function computeInventoryValue() {
  return loadInventory().reduce(
    (sum, p) => sum + (Number(p.quantity) || 0) * (Number(p.costPrice) || 0),
    0
  );
}

// ---- 7d. Suppliers storage -----------------------------------------------------

function loadSuppliers() {
  const raw = localStorage.getItem(SUPPLIERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveSuppliers(suppliers) {
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
}

function addSupplier(supplier) {
  const suppliers = loadSuppliers();
  suppliers.push(supplier);
  saveSuppliers(suppliers);
}

// ---- 7e. Purchases storage ------------------------------------------------------

function loadPurchases() {
  const raw = localStorage.getItem(PURCHASES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function savePurchases(purchases) {
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
}

function addPurchase(purchase) {
  const purchases = loadPurchases();
  purchases.push(purchase);
  savePurchases(purchases);

  // Add the purchased quantity to each existing Inventory product, and
  // record this purchase's cost price as the product's new "current" cost
  // price. The original cost price paid stays on the purchase record itself,
  // so past purchases are never rewritten.
  const products = loadInventory();
  let inventoryChanged = false;
  purchase.items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      product.quantity = (Number(product.quantity) || 0) + item.qty;
      product.costPrice = item.costPrice;
      inventoryChanged = true;
    }
  });
  if (inventoryChanged) {
    saveInventory(products);
  }

  // NBA does not move money — it only records how the purchase was paid for.
  // Cash and Bank reduce immediately. Credit does not touch either balance;
  // the amount owed is instead calculated from Credit purchases per supplier.
  const business = loadBusiness();
  if (business) {
    if (purchase.paymentMethod === "Cash") {
      business.cash = (Number(business.cash) || 0) - purchase.total;
    } else if (purchase.paymentMethod === "Bank") {
      business.bank = (Number(business.bank) || 0) - purchase.total;
    }
    saveBusiness(business);
  }
}

// ---- 7f. Expenses storage -------------------------------------------------------

function loadExpenses() {
  const raw = localStorage.getItem(EXPENSES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveExpenses(expenses) {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

// Expense numbers (EXP-0001, EXP-0002, ...) come from a counter that only
// ever goes up, so a number is never reused after an expense is deleted.
function nextExpenseNumber() {
  const current = parseInt(localStorage.getItem(EXPENSE_COUNTER_KEY), 10) || 0;
  const next = current + 1;
  localStorage.setItem(EXPENSE_COUNTER_KEY, String(next));
  return "EXP-" + String(next).padStart(4, "0");
}

// NBA does not move money — this only records which balance an expense
// affects. sign is +1 to reverse a past effect, -1 to apply a new one.
function applyExpenseEffect(expense, sign) {
  const business = loadBusiness();
  if (!business) return;
  const amount = (Number(expense.amount) || 0) * sign;
  if (expense.paymentMethod === "Cash") {
    business.cash = (Number(business.cash) || 0) + amount;
  } else if (expense.paymentMethod === "Bank") {
    business.bank = (Number(business.bank) || 0) + amount;
  }
  saveBusiness(business);
}

function addExpense(expense) {
  const expenses = loadExpenses();
  expenses.push(expense);
  saveExpenses(expenses);
  applyExpenseEffect(expense, -1);
}

// Reverses the old expense's effect on Cash/Bank before applying the new
// one, so editing the amount or switching Cash <-> Bank never double-counts.
function updateExpense(id, updatedFields) {
  const expenses = loadExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return false;

  const original = expenses[index];
  applyExpenseEffect(original, +1);

  const updated = Object.assign({}, original, updatedFields, { updatedAt: new Date().toISOString() });
  expenses[index] = updated;
  saveExpenses(expenses);

  applyExpenseEffect(updated, -1);
  return true;
}

function deleteExpense(id) {
  const expenses = loadExpenses();
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) return false;

  applyExpenseEffect(expenses[index], +1);
  expenses.splice(index, 1);
  saveExpenses(expenses);
  return true;
}

// ---- 7f2. Drawings storage --------------------------------------------------

// A drawing is money the owner takes out for personal use — it reduces Cash
// or Bank exactly like an Expense does, but it is NEVER counted as a
// business expense and never affects Sales, Inventory, or Profit. Keeping it
// in its own storage key (separate from Expenses) is what keeps that
// distinction clean everywhere else in the app.
function loadDrawings() {
  const raw = localStorage.getItem(DRAWINGS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveDrawings(drawings) {
  localStorage.setItem(DRAWINGS_KEY, JSON.stringify(drawings));
}

// Drawing numbers (DRW-0001, DRW-0002, ...) come from a counter that only
// ever goes up, so a number is never reused after a drawing is deleted.
function nextDrawingNumber() {
  const current = parseInt(localStorage.getItem(DRAWING_COUNTER_KEY), 10) || 0;
  const next = current + 1;
  localStorage.setItem(DRAWING_COUNTER_KEY, String(next));
  return "DRW-" + String(next).padStart(4, "0");
}

// sign is +1 to reverse a past effect, -1 to apply a new one.
function applyDrawingEffect(drawing, sign) {
  const business = loadBusiness();
  if (!business) return;
  const amount = (Number(drawing.amount) || 0) * sign;
  if (drawing.paymentMethod === "Cash") {
    business.cash = (Number(business.cash) || 0) + amount;
  } else if (drawing.paymentMethod === "Bank") {
    business.bank = (Number(business.bank) || 0) + amount;
  }
  saveBusiness(business);
}

function addDrawing(drawing) {
  const drawings = loadDrawings();
  drawings.push(drawing);
  saveDrawings(drawings);
  applyDrawingEffect(drawing, -1);
}

// Reverses the old drawing's effect on Cash/Bank before applying the new
// one, so editing the amount or switching Cash <-> Bank never double-counts.
function updateDrawing(id, updatedFields) {
  const drawings = loadDrawings();
  const index = drawings.findIndex((d) => d.id === id);
  if (index === -1) return false;

  const original = drawings[index];
  applyDrawingEffect(original, +1);

  const updated = Object.assign({}, original, updatedFields, { updatedAt: new Date().toISOString() });
  drawings[index] = updated;
  saveDrawings(drawings);

  applyDrawingEffect(updated, -1);
  return true;
}

function deleteDrawing(id) {
  const drawings = loadDrawings();
  const index = drawings.findIndex((d) => d.id === id);
  if (index === -1) return false;

  applyDrawingEffect(drawings[index], +1);
  drawings.splice(index, 1);
  saveDrawings(drawings);
  return true;
}

function computeTotalDrawings() {
  return loadDrawings().reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}

function computeCashDrawings() {
  return loadDrawings()
    .filter((d) => d.paymentMethod === "Cash")
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}

function computeBankDrawings() {
  return loadDrawings()
    .filter((d) => d.paymentMethod === "Bank")
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
}

// The Cash/Bank balance a drawing is allowed to use, accounting for the fact
// that editing a drawing first reverses its old effect. This is what
// prevents a drawing from pushing Cash or Bank negative.
function availableBalanceForDrawing(paymentMethod, excludingDrawingId) {
  const business = loadBusiness();
  let cash = Number(business && business.cash) || 0;
  let bank = Number(business && business.bank) || 0;

  if (excludingDrawingId) {
    const original = loadDrawings().find((d) => d.id === excludingDrawingId);
    if (original) {
      if (original.paymentMethod === "Cash") {
        cash += Number(original.amount) || 0;
      } else if (original.paymentMethod === "Bank") {
        bank += Number(original.amount) || 0;
      }
    }
  }

  return paymentMethod === "Cash" ? cash : bank;
}

// ---- 7f3. Inventory Adjustments storage (Module 21) --------------------------
// Any stock change that is NOT a Purchase and NOT a Sale (manual corrections,
// damage, spoilage, recounts, etc.) is recorded here as its own transaction
// type. It never touches Purchases or Sales, and it never pretends to be one.
// Existing Inventory quantities are only ever mutated through addStockToProduct
// (already defined above), so this module reuses that exact function instead
// of writing a competing inventory-mutation path.

function loadInventoryAdjustments() {
  const raw = localStorage.getItem(INVENTORY_ADJUSTMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveInventoryAdjustments(adjustments) {
  localStorage.setItem(INVENTORY_ADJUSTMENTS_KEY, JSON.stringify(adjustments));
}

// Adjustment numbers (ADJ-0001, ADJ-0002, ...) come from a counter that only
// ever goes up, so a number is never reused, exactly like Expense/Drawing numbers.
function nextAdjustmentNumber() {
  const current = parseInt(localStorage.getItem(ADJUSTMENT_COUNTER_KEY), 10) || 0;
  const next = current + 1;
  localStorage.setItem(ADJUSTMENT_COUNTER_KEY, String(next));
  return "ADJ-" + String(next).padStart(4, "0");
}

// Creates a manual Stock Adjustment record and applies it to Inventory.
// qtyChange is signed: positive to add stock, negative to remove stock.
// Returns { ok: true, record } on success, or { ok: false, error } if the
// adjustment would take the product below zero units.
function createStockAdjustment({ productId, qtyChange, reason, note }) {
  const products = loadInventory();
  const product = products.find((p) => p.id === productId);
  if (!product) return { ok: false, error: "That product no longer exists in Inventory." };

  const previousQty = Number(product.quantity) || 0;
  const change = Number(qtyChange) || 0;
  if (!change) return { ok: false, error: "Enter a quantity that is not zero." };

  const newQty = previousQty + change;
  if (newQty < 0) {
    return {
      ok: false,
      error: `That would take ${product.name} below zero (currently ${previousQty} in stock). Enter a smaller quantity.`
    };
  }

  const record = {
    id: Date.now().toString(),
    adjustmentNumber: nextAdjustmentNumber(),
    productId: product.id,
    productName: product.name,
    qtyChange: change,
    previousQty,
    newQty,
    reason: reason || "Other",
    note: note || "",
    type: change > 0 ? "addition" : "removal",
    reversed: false,
    reversedAt: null,
    reversalOfId: null,
    date: todayDateValue(),
    createdAt: new Date().toISOString()
  };

  const adjustments = loadInventoryAdjustments();
  adjustments.push(record);
  saveInventoryAdjustments(adjustments);

  // Reuses the existing, already-tested inventory mutator — this never
  // introduces a second way of changing a product's quantity.
  addStockToProduct(product.id, change);

  return { ok: true, record };
}

// Safely reverses a Stock Adjustment. Never deletes the original record —
// it is marked reversed and a linked reversal record is created for the
// audit trail. If reversing would take the product negative (because some
// of an added quantity has since been sold or otherwise consumed), the
// reversal is refused rather than silently creating negative stock.
function reverseStockAdjustment(adjustmentId) {
  const adjustments = loadInventoryAdjustments();
  const original = adjustments.find((a) => a.id === adjustmentId);
  if (!original) return { ok: false, error: "That adjustment could not be found." };
  if (original.reversed) return { ok: false, error: "This adjustment has already been reversed." };

  const products = loadInventory();
  const product = products.find((p) => p.id === original.productId);
  if (!product) return { ok: false, error: "That product no longer exists in Inventory." };

  const currentQty = Number(product.quantity) || 0;
  const reversalChange = -original.qtyChange;
  const newQty = currentQty + reversalChange;

  if (newQty < 0) {
    return {
      ok: false,
      error: `Cannot reverse this adjustment: ${product.name} only has ${currentQty} in stock now (some of the adjusted stock has already been sold or used). Adjust the quantity manually first.`
    };
  }

  original.reversed = true;
  original.reversedAt = new Date().toISOString();

  const reversalRecord = {
    id: Date.now().toString() + "-rev",
    adjustmentNumber: nextAdjustmentNumber(),
    productId: product.id,
    productName: product.name,
    qtyChange: reversalChange,
    previousQty: currentQty,
    newQty,
    reason: "Reversal",
    note: `Reverses ${original.adjustmentNumber}`,
    type: "reversal",
    reversed: false,
    reversedAt: null,
    reversalOfId: original.id,
    date: todayDateValue(),
    createdAt: new Date().toISOString()
  };
  original.reversalRecordId = reversalRecord.id;

  adjustments.push(reversalRecord);
  saveInventoryAdjustments(adjustments);

  addStockToProduct(product.id, reversalChange);

  return { ok: true, record: reversalRecord };
}

// ---- 7f4. Money Transfers storage (Module 22) ---------------------------------
// An internal movement of money between Cash and Bank. It is NOT a Sale,
// Expense, Purchase, Income, Profit, or Drawing — it only ever moves the
// SAME money between the two balances already stored on the business
// object, so Cash + Bank always stays the same before and after a transfer.

function loadMoneyTransfers() {
  const raw = localStorage.getItem(MONEY_TRANSFERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveMoneyTransfers(transfers) {
  localStorage.setItem(MONEY_TRANSFERS_KEY, JSON.stringify(transfers));
}

// Transfer numbers (TRF-0001, TRF-0002, ...) come from a counter that only
// ever goes up, so a number is never reused, exactly like Expense/Drawing numbers.
function nextTransferNumber() {
  const current = parseInt(localStorage.getItem(TRANSFER_COUNTER_KEY), 10) || 0;
  const next = current + 1;
  localStorage.setItem(TRANSFER_COUNTER_KEY, String(next));
  return "TRF-" + String(next).padStart(4, "0");
}

// Creates and applies a Cash <-> Bank transfer. fromAccount/toAccount must be
// exactly "Cash" or "Bank" and must differ. Returns { ok: false, error } for
// any invalid request (same account, zero/negative amount, insufficient funds)
// without changing anything.
function createMoneyTransfer({ fromAccount, toAccount, amount, note, date }) {
  const validAccounts = ["Cash", "Bank"];
  if (!validAccounts.includes(fromAccount) || !validAccounts.includes(toAccount)) {
    return { ok: false, error: "Transfers can only be between Cash and Bank." };
  }
  if (fromAccount === toAccount) {
    return { ok: false, error: "Choose two different accounts to transfer between." };
  }
  const amt = Number(amount);
  if (!(amt > 0)) {
    return { ok: false, error: "Enter a transfer amount greater than ₦0." };
  }

  const business = loadBusiness();
  if (!business) return { ok: false, error: "No business profile found." };

  const fromBalance = fromAccount === "Cash" ? (Number(business.cash) || 0) : (Number(business.bank) || 0);
  if (amt > fromBalance) {
    return { ok: false, error: `Insufficient ${fromAccount.toLowerCase()} balance. Available: ${formatNaira(fromBalance)}.` };
  }

  if (fromAccount === "Cash") {
    business.cash = (Number(business.cash) || 0) - amt;
    business.bank = (Number(business.bank) || 0) + amt;
  } else {
    business.bank = (Number(business.bank) || 0) - amt;
    business.cash = (Number(business.cash) || 0) + amt;
  }
  saveBusiness(business);

  const record = {
    id: Date.now().toString(),
    transferNumber: nextTransferNumber(),
    fromAccount,
    toAccount,
    amount: amt,
    note: note || "",
    status: "completed",
    reversed: false,
    reversedAt: null,
    reversalOfId: null,
    date: date || todayDateValue(),
    createdAt: new Date().toISOString()
  };

  const transfers = loadMoneyTransfers();
  transfers.push(record);
  saveMoneyTransfers(transfers);

  return { ok: true, record };
}

// Safely reverses a Money Transfer by moving the same amount back the other
// way. Never deletes the original record — it is marked reversed. Refuses
// if the account it needs to pull from no longer has enough money (e.g. it
// was spent after the transfer), rather than allowing a negative balance.
function reverseMoneyTransfer(transferId) {
  const transfers = loadMoneyTransfers();
  const original = transfers.find((t) => t.id === transferId);
  if (!original) return { ok: false, error: "That transfer could not be found." };
  if (original.reversed) return { ok: false, error: "This transfer has already been reversed." };

  const business = loadBusiness();
  if (!business) return { ok: false, error: "No business profile found." };

  // Reversing means moving the money back: from toAccount back to fromAccount.
  const pullFrom = original.toAccount;
  const pullBalance = pullFrom === "Cash" ? (Number(business.cash) || 0) : (Number(business.bank) || 0);
  if (original.amount > pullBalance) {
    return {
      ok: false,
      error: `Cannot reverse: ${pullFrom} balance is now only ${formatNaira(pullBalance)}, less than the ${formatNaira(original.amount)} to move back.`
    };
  }

  if (pullFrom === "Cash") {
    business.cash = (Number(business.cash) || 0) - original.amount;
    business.bank = (Number(business.bank) || 0) + original.amount;
  } else {
    business.bank = (Number(business.bank) || 0) - original.amount;
    business.cash = (Number(business.cash) || 0) + original.amount;
  }
  saveBusiness(business);

  original.reversed = true;
  original.reversedAt = new Date().toISOString();
  original.status = "reversed";
  saveMoneyTransfers(transfers);

  return { ok: true, record: original };
}

function computeTotalTransfers() {
  return loadMoneyTransfers().reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

function computeCashToBankTransfers() {
  return loadMoneyTransfers()
    .filter((t) => t.fromAccount === "Cash")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

function computeBankToCashTransfers() {
  return loadMoneyTransfers()
    .filter((t) => t.fromAccount === "Bank")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}

// ---- 7g. Customers storage -----------------------------------------------------

function loadCustomers() {
  const raw = localStorage.getItem(CUSTOMERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveCustomers(customers) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

function addCustomer(customer) {
  const customers = loadCustomers();
  customers.push(customer);
  saveCustomers(customers);
}

// ---- 7h. Customer payments storage ----------------------------------------------

function loadCustomerPayments() {
  const raw = localStorage.getItem(CUSTOMER_PAYMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveCustomerPayments(payments) {
  localStorage.setItem(CUSTOMER_PAYMENTS_KEY, JSON.stringify(payments));
}

function addCustomerPayment(payment) {
  const payments = loadCustomerPayments();
  payments.push(payment);
  saveCustomerPayments(payments);

  // NBA does not move money — it only records how the payment was received.
  const business = loadBusiness();
  if (business) {
    if (payment.paymentMethod === "Cash") {
      business.cash = (Number(business.cash) || 0) + payment.amount;
    } else if (payment.paymentMethod === "Bank") {
      business.bank = (Number(business.bank) || 0) + payment.amount;
    }
    saveBusiness(business);
  }
}

// A customer's balance is never stored as a typed number — it's always
// derived live from their Credit sales minus their payments, the same way
// Supplier balances are derived from Credit purchases (see getSupplierStats).
function getCustomerStats(customerId) {
  const creditSales = loadSales()
    .filter((s) => s.paymentType === "Credit" && s.customerId === customerId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const payments = loadCustomerPayments()
    .filter((p) => p.customerId === customerId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const totalCharges = creditSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balance = totalCharges - totalPayments;

  return { totalCharges, totalPayments, balance, creditSales, payments };
}

function computeTotalReceivables() {
  return loadCustomers().reduce((sum, c) => sum + getCustomerStats(c.id).balance, 0);
}

// ---- 7i. Supplier payments storage -----------------------------------------------

function loadSupplierPayments() {
  const raw = localStorage.getItem(SUPPLIER_PAYMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveSupplierPayments(payments) {
  localStorage.setItem(SUPPLIER_PAYMENTS_KEY, JSON.stringify(payments));
}

function addSupplierPayment(payment) {
  const payments = loadSupplierPayments();
  payments.push(payment);
  saveSupplierPayments(payments);

  // A supplier payment settles money already owed — it is not a new
  // purchase, so it never touches Inventory or Profit. It only reduces
  // Cash or Bank, exactly like a Purchase does, and reduces the amount
  // owed to that supplier (calculated live in getSupplierStats).
  const business = loadBusiness();
  if (business) {
    if (payment.paymentMethod === "Cash") {
      business.cash = (Number(business.cash) || 0) - payment.amount;
    } else if (payment.paymentMethod === "Bank") {
      business.bank = (Number(business.bank) || 0) - payment.amount;
    }
    saveBusiness(business);
  }
}

// A supplier's outstanding balance is never stored as a typed number — it's
// always derived live from their Credit purchases minus their payments, the
// same way Customer balances are derived from Credit sales minus payments
// (see getCustomerStats). Cash/Bank purchases are settled immediately and
// don't add to the balance owed.
function getSupplierStats(supplierId) {
  const purchases = loadPurchases()
    .filter((p) => p.supplierId === supplierId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const creditPurchases = purchases.filter((p) => p.paymentMethod === "Credit");
  const payments = loadSupplierPayments()
    .filter((p) => p.supplierId === supplierId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const total = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const creditTotal = creditPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const totalPayments = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const owed = creditTotal - totalPayments;
  const paid = total - owed;

  return { total, owed, paid, totalPayments, purchases, payments };
}

function computeTotalPayables() {
  return loadSuppliers().reduce((sum, s) => sum + getSupplierStats(s.id).owed, 0);
}

function fillFormFromData(data) {
  fields.businessName.value = data.businessName || "";
  fields.businessType.value = data.businessType || "";
  fields.country.value = data.country || "Nigeria";
  fields.state.value = data.state || "";
  fields.address.value = data.address || "";
  fields.ownerName.value = data.ownerName || "";
  fields.phone.value = data.phone || "";
  fields.email.value = data.email || "";
  fields.cash.value = data.cash || 0;
  fields.bank.value = data.bank || 0;
  fields.stock.value = data.stock || 0;
  updatePreview();
}

// ---- 8. View switching --------------------------------------------------------

function showSetup() {
  dashboardView.hidden = true;
  setupView.hidden = false;
}

function showSuccessView() {
  showSetup();
  form.hidden = true;
  successPanel.hidden = false;
  preview.status.textContent = "Business profile";
  preview.badge.hidden = false;
}

function showFormView() {
  showSetup();
  form.hidden = false;
  successPanel.hidden = true;
  preview.status.textContent = "Business preview";
  preview.badge.hidden = true;
}

function showDashboard() {
  setupView.hidden = true;
  dashboardView.hidden = false;
  renderDashboard();
  if (typeof updateVoiceFabVisibility === "function") updateVoiceFabVisibility();
}

// ---- 8b. Dashboard rendering ---------------------------------------------------

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function renderDashboard() {
  const data = loadBusiness();
  if (!data) {
    // Safety net: if there's no business data, there is nothing to show yet.
    showFormView();
    return;
  }

  const firstName = (data.ownerName || "").trim().split(" ")[0] || "there";
  dash.greeting.textContent = `${getGreeting()}, ${firstName} 👋`;
  dash.businessName.textContent = data.businessName || "Your business";
  dash.businessMeta.textContent =
    `${data.businessType || "Business type"} · ${data.state || "State"}, ${data.country || "Nigeria"}`;
  dashTodayDate.textContent = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // ---- Financial overview: current snapshot balances, independent of the
  // period selector below (a balance is "as of now", not "within a range"). ----
  const cash = Number(data.cash) || 0;
  const bank = Number(data.bank) || 0;
  // Once products exist in Inventory, their live total value is more accurate
  // than the one-time opening estimate from Business Setup, so it takes over.
  const inventoryProducts = loadInventory();
  const stock = inventoryProducts.length > 0 ? computeInventoryValue() : (Number(data.stock) || 0);

  dash.statCash.textContent = formatNaira(cash);
  dash.statBank.textContent = formatNaira(bank);
  dash.statStock.textContent = formatNaira(stock);
  dash.statReceivables.textContent = formatNaira(computeTotalReceivables());
  dash.statPayables.textContent = formatNaira(computeTotalPayables());
  dash.statDrawings.textContent = formatNaira(computeTotalDrawings());
  dash.statTotal.textContent = formatNaira(cash + bank);

  // ---- Period-based performance: same engine Reports uses, just with the
  // Dashboard's own independently-selected period. ----
  renderDashboardPeriod();

  // ---- Snapshot widgets: not period-based, so they don't change with the
  // period selector above. ----
  const inventoryData = computeInventoryReportData();
  renderLowStockList(dashLowStockList, inventoryData.lowStock);
  renderRecentSalesList(dashRecentSalesList, loadSales());
  renderBusinessAlerts(dashAlertsList, inventoryData);
  renderDashboardBackupReminder();
  updateAlertsBadge();
}

// Recomputes and repaints only the part of the Dashboard that depends on the
// selected period (Today / This Week / This Month / This Year) — the exact
// same calculation functions Reports uses, just called with the Dashboard's
// own period instead of the Reports section's.
function renderDashboardPeriod() {
  const bounds = getRangeBounds(dashboardDateRangeType, null, null);

  const sales = getFilteredSales(bounds);
  const expenses = getFilteredExpenses(bounds);

  const salesReport = computeSalesReport(sales);
  const grossProfit = sales.reduce((sum, sale) => sum + computeSaleProfit(sale), 0);
  const expensesReport = computeExpensesReport(expenses);
  const netProfit = grossProfit - expensesReport.total;

  dashPeriodTitle.textContent = `${DASHBOARD_RANGE_LABELS[dashboardDateRangeType]}'s activity`;
  dash.statSales.textContent = formatNaira(salesReport.totalSales);
  dash.statGrossProfit.textContent = formatNaira(grossProfit);
  dash.statExpenses.textContent = formatNaira(expensesReport.total);
  dash.statNetProfit.textContent = formatNaira(netProfit);
  dash.statTransactions.textContent = String(salesReport.numberOfSales);

  renderTopProductsList(dashTopProductsList, computeTopProductsReport(sales, 5));
  renderSalesTrendChart(dashSalesTrendChart, computeSalesTrend(sales));

  // Sales payment-method breakdown only — Purchases/Expenses/Drawings are
  // deliberately excluded here, unlike the equivalent table in Reports.
  if (sales.length === 0) {
    dashPaymentMethodsGrid.innerHTML = '<div class="sales-empty">No sales for this period.</div>';
  } else {
    renderStatGrid(dashPaymentMethodsGrid, [
      ["Cash", formatNaira(salesReport.cash)],
      ["Bank", formatNaira(salesReport.bank)],
      ["POS", formatNaira(salesReport.pos)],
      ["Credit", formatNaira(salesReport.credit)]
    ]);
  }
}

function renderLowStockList(container, lowStockProducts) {
  if (lowStockProducts.length === 0) {
    container.innerHTML = '<div class="alert-ok">✓ All products are sufficiently stocked.</div>';
    return;
  }
  container.innerHTML = lowStockProducts
    .map(
      (p) => `
        <div class="alert-row">
          <span>⚠ ${escapeHtml(p.name)}</span>
          <span>Only ${Number(p.quantity) || 0} left</span>
        </div>
      `
    )
    .join("");
}

function renderRecentSalesList(container, allSales) {
  if (allSales.length === 0) {
    container.innerHTML = '<div class="sales-empty">No sales recorded yet.</div>';
    return;
  }
  const recent = allSales
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  container.innerHTML = recent
    .map((sale) => {
      const dateLabel = new Date(sale.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
      const customerLabel = sale.customerId && sale.customerName ? sale.customerName : "Walk-in Customer";
      const methodLabel = sale.paymentType === "Credit" ? "Credit" : (sale.paymentMethod || "—");
      return `
        <button type="button" class="recent-sale-row" data-id="${sale.id}">
          <span class="recent-sale-date">${dateLabel}</span>
          <span class="recent-sale-customer">${escapeHtml(customerLabel)}</span>
          <span class="recent-sale-total">${formatNaira(sale.total)}</span>
          <span class="recent-sale-method">${escapeHtml(methodLabel)}</span>
        </button>
      `;
    })
    .join("");
}

dashRecentSalesList.addEventListener("click", (event) => {
  const btn = event.target.closest(".recent-sale-row");
  if (!btn) return;
  openReceiptModal(btn.dataset.id, { justCompleted: false });
});

// Every alert here is read directly off real data — nothing here is
// invented or estimated. "Unusually high expenses" from the spec is
// intentionally left out: there's no existing baseline anywhere in NBA to
// compare against, and making one up would be exactly the kind of
// fabricated logic this app avoids elsewhere.
function renderBusinessAlerts(container, inventoryData) {
  const alerts = [];

  inventoryData.lowStock.slice(0, 3).forEach((p) => {
    alerts.push(`⚠ ${escapeHtml(p.name)} is low in stock (${Number(p.quantity) || 0} left).`);
  });

  const receivables = computeReceivablesReport();
  if (receivables.rows.length > 0) {
    const top = receivables.rows[0];
    alerts.push(`⚠ ${escapeHtml(top.name)} owes ${formatNaira(top.balance)}.`);
  }

  const payables = computePayablesReport();
  if (payables.rows.length > 0) {
    const top = payables.rows[0];
    alerts.push(`⚠ You owe ${escapeHtml(top.name)} ${formatNaira(top.owed)}.`);
  }

  const todaysSalesCount = loadSales().filter((s) => isToday(s.createdAt)).length;
  if (todaysSalesCount === 0) {
    alerts.push("⚠ No sales recorded today yet.");
  }

  if (alerts.length === 0) {
    container.innerHTML = '<div class="alert-ok">✓ No urgent alerts.</div>';
    return;
  }
  container.innerHTML = alerts.map((text) => `<div class="alert-row">${text}</div>`).join("");
}

function renderDashboardBackupReminder() {
  const lastBackupRaw = localStorage.getItem(LAST_BACKUP_KEY);
  if (lastBackupRaw) {
    dashBackupInfo.textContent = `Last backup: ${formatReportDate(new Date(lastBackupRaw))}`;
    dashBackupBtn.textContent = "Backup & Restore";
  } else {
    dashBackupInfo.textContent = "No recent backup found.";
    dashBackupBtn.textContent = "Back Up Now";
  }
}

dashPeriodPills.addEventListener("click", (event) => {
  const btn = event.target.closest(".report-pill");
  if (!btn) return;

  dashboardDateRangeType = btn.dataset.range;
  dashPeriodPills.querySelectorAll(".report-pill").forEach((p) => {
    p.classList.toggle("is-active", p === btn);
  });

  renderDashboardPeriod();
});

dashViewReportsBtn.addEventListener("click", () => {
  selectDashSection("reports");
});

dashBackupBtn.addEventListener("click", () => {
  selectDashSection("settings");
});

function computeSaleProfit(sale) {
  return (sale.items || []).reduce((sum, item) => {
    if (!item.productId) return sum; // custom items have no known cost price
    const cost = Number(item.costPrice) || 0;
    return sum + item.qty * (item.price - cost);
  }, 0);
}

// ---- 8c. Dashboard navigation ---------------------------------------------------

function selectDashSection(section) {
  const navButtons = dashNav.querySelectorAll(".dash-nav-item");
  navButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.section === section);
  });

  dashSectionDashboard.hidden = true;
  dashSectionSales.hidden = true;
  dashSectionInventory.hidden = true;
  dashSectionPurchases.hidden = true;
  dashSectionSuppliers.hidden = true;
  dashSectionExpenses.hidden = true;
  dashSectionDrawings.hidden = true;
  dashSectionTransfers.hidden = true;
  dashSectionCustomers.hidden = true;
  dashSectionReports.hidden = true;
  dashSectionSettings.hidden = true;
  dashSectionAlerts.hidden = true;
  dashSectionAI.hidden = true;
  dashSectionComingSoon.hidden = true;

  updateAlertsBadge();

  if (section === "dashboard") {
    dashSectionDashboard.hidden = false;
    renderDashboard();
    return;
  }

  if (section === "sales") {
    dashSectionSales.hidden = false;
    renderSalesTodaySummary();
    renderSalesList();
    return;
  }

  if (section === "inventory") {
    dashSectionInventory.hidden = false;
    renderInventorySummary();
    renderProductList();
    renderStockAdjustmentsList();
    return;
  }

  if (section === "transfers") {
    dashSectionTransfers.hidden = false;
    renderTransfersStatGrid();
    renderTransferList();
    return;
  }

  if (section === "purchases") {
    dashSectionPurchases.hidden = false;
    renderPurchasesTodaySummary();
    renderPurchaseList();
    return;
  }

  if (section === "suppliers") {
    dashSectionSuppliers.hidden = false;
    showSuppliersListView();
    return;
  }

  if (section === "expenses") {
    dashSectionExpenses.hidden = false;
    renderExpensesTodaySummary();
    renderExpenseList();
    return;
  }

  if (section === "drawings") {
    dashSectionDrawings.hidden = false;
    renderDrawingsTodaySummary();
    renderDrawingsStatGrid();
    renderDrawingList();
    return;
  }

  if (section === "customers") {
    dashSectionCustomers.hidden = false;
    showCustomersListView();
    return;
  }

  if (section === "reports") {
    dashSectionReports.hidden = false;
    renderReports();
    return;
  }

  if (section === "settings") {
    dashSectionSettings.hidden = false;
    renderSettingsSection();
    return;
  }

  if (section === "alerts") {
    dashSectionAlerts.hidden = false;
    renderAlertsPage();
    return;
  }

  if (section === "ai") {
    dashSectionAI.hidden = false;
    if (aiChatInput) aiChatInput.focus();
    return;
  }

  dashSectionComingSoon.hidden = false;

  const label = section.charAt(0).toUpperCase() + section.slice(1);
  comingSoonTitle.textContent = label;
  comingSoonText.textContent = COMING_SOON_TEXT[section] || "This section is coming soon.";
}

dashNav.addEventListener("click", (event) => {
  const btn = event.target.closest(".dash-nav-item");
  if (!btn) return;
  selectDashSection(btn.dataset.section);
});

dashSectionDashboard.addEventListener("click", (event) => {
  const btn = event.target.closest(".quick-action-btn");
  if (!btn) return;

  if (btn.dataset.action === "New Sale") {
    selectDashSection("sales");
    openNewSaleForm();
    return;
  }

  if (btn.dataset.action === "Add Product") {
    selectDashSection("inventory");
    openNewProductForm();
    return;
  }

  if (btn.dataset.action === "Purchase") {
    selectDashSection("purchases");
    openNewPurchaseForm();
    return;
  }

  if (btn.dataset.action === "Add Customer") {
    selectDashSection("customers");
    openNewCustomerForm();
    return;
  }

  if (btn.dataset.action === "Add Supplier") {
    selectDashSection("suppliers");
    openNewSupplierForm();
    return;
  }

  if (btn.dataset.action === "Expense") {
    selectDashSection("expenses");
    openNewExpenseForm();
    return;
  }

  if (btn.dataset.action === "Drawing") {
    selectDashSection("drawings");
    openNewDrawingForm();
    return;
  }

  // Recording a payment requires picking WHICH customer/supplier first, so
  // these two open the existing list — the natural next tap is a customer
  // or supplier, whose detail view already has "+ Record Payment".
  if (btn.dataset.action === "Customer Payment") {
    selectDashSection("customers");
    return;
  }

  if (btn.dataset.action === "Supplier Payment") {
    selectDashSection("suppliers");
    return;
  }

  alert("This module is coming next.");
});

settingsEditBtn.addEventListener("click", () => {
  showFormView();
  fields.businessName.focus();
});

goDashboardBtn.addEventListener("click", () => {
  showDashboard();
});

// ---- 8d. Sales: cart-based sale entry --------------------------------------------

let saleCart = [];

function computeSaleTotal() {
  return saleCart.reduce((sum, item) => sum + item.qty * item.price, 0);
}

function qtyAlreadyInCart(productId) {
  return saleCart
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + item.qty, 0);
}

function renderSaleCart() {
  if (saleCart.length === 0) {
    saleItemRows.innerHTML = '<p class="sale-empty-cart">No items added yet.</p>';
  } else {
    saleItemRows.innerHTML = saleCart
      .map((item, index) => `
        <div class="sale-item-row sale-item-row-entry">
          <span class="sale-item-name">${escapeHtml(item.name)}</span>
          <span class="sale-item-qty">${item.qty}</span>
          <span class="sale-item-price">${formatNaira(item.qty * item.price)}</span>
          <button type="button" class="sale-item-remove" data-index="${index}" aria-label="Remove item">×</button>
        </div>
      `)
      .join("");
  }
  saleTotalValue.textContent = formatNaira(computeSaleTotal());
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Fill the item dropdown with current Inventory products, so stock and prices
// are always up to date each time the sale form is opened.
function populateItemProductSelect() {
  const products = loadInventory();
  const optionsHtml = products
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)} — ${p.quantity} in stock</option>`)
    .join("");
  itemProductSelect.innerHTML =
    '<option value="" disabled selected>Select item</option>' +
    '<option value="custom">✎ Custom item (not in inventory)</option>' +
    optionsHtml;
}

itemProductSelect.addEventListener("change", () => {
  const value = itemProductSelect.value;
  itemStockHint.textContent = "";
  itemStockHint.classList.remove("stock-hint-low");

  if (value === "custom") {
    customItemName.hidden = false;
    customItemName.value = "";
    customItemName.focus();
    newItemPrice.value = "";
    return;
  }

  customItemName.hidden = true;
  const product = loadInventory().find((p) => p.id === value);
  if (!product) return;

  newItemPrice.value = product.sellingPrice;
  const available = (Number(product.quantity) || 0) - qtyAlreadyInCart(product.id);
  itemStockHint.textContent = `${available} available in stock`;
  if (available <= 0) {
    itemStockHint.textContent = "Out of stock";
    itemStockHint.classList.add("stock-hint-low");
  }
});

function populateSaleCustomerSelect() {
  const customers = loadCustomers();
  saleCustomerSelect.innerHTML =
    '<option value="" disabled selected>Select customer</option>' +
    customers.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  saleCustomerHint.textContent = customers.length === 0
    ? 'No customers yet — add one in the "Customers" section first.'
    : "";
}

function updateSalePaymentTypeUI() {
  const isCredit = salePaymentType.value === "Credit";
  saleCustomerField.hidden = !isCredit;
  salePaymentMethodField.hidden = isCredit;
  if (isCredit) {
    populateSaleCustomerSelect();
  }
}

salePaymentType.addEventListener("change", updateSalePaymentTypeUI);

function resetSaleForm() {
  saleCart = [];
  populateItemProductSelect();
  itemProductSelect.value = "";
  customItemName.hidden = true;
  customItemName.value = "";
  itemStockHint.textContent = "";
  itemStockHint.classList.remove("stock-hint-low");
  newItemQty.value = "1";
  newItemPrice.value = "";
  salePaymentType.value = "Paid";
  saleCustomerSelect.value = "";
  const defaultMethod = loadSettings().defaultPaymentMethod;
  paymentMethod.value = ["Cash", "Bank Transfer", "POS", "Other"].includes(defaultMethod) ? defaultMethod : "";
  saleFormError.textContent = "";
  updateSalePaymentTypeUI();
  renderSaleCart();
}

function openNewSaleForm() {
  resetSaleForm();
  saleFormCard.hidden = false;
  itemProductSelect.focus();
}

newSaleBtn.addEventListener("click", openNewSaleForm);

cancelSaleBtn.addEventListener("click", () => {
  saleFormCard.hidden = true;
  resetSaleForm();
});

addItemBtn.addEventListener("click", () => {
  const selectValue = itemProductSelect.value;
  const qty = Number(newItemQty.value);
  const price = Number(newItemPrice.value);

  if (!selectValue) {
    saleFormError.textContent = "Select an item.";
    itemProductSelect.focus();
    return;
  }

  let name, productId, costPrice;

  if (selectValue === "custom") {
    name = customItemName.value.trim();
    if (!name) {
      saleFormError.textContent = "Enter a custom item name.";
      customItemName.focus();
      return;
    }
    productId = null;
    costPrice = 0;
  } else {
    const product = loadInventory().find((p) => p.id === selectValue);
    if (!product) {
      saleFormError.textContent = "That product no longer exists in Inventory.";
      return;
    }
    name = product.name;
    productId = product.id;
    costPrice = Number(product.costPrice) || 0;
  }

  if (!qty || qty <= 0) {
    saleFormError.textContent = "Enter a quantity of at least 1.";
    newItemQty.focus();
    return;
  }

  if (productId) {
    const product = loadInventory().find((p) => p.id === productId);
    const available = (Number(product.quantity) || 0) - qtyAlreadyInCart(productId);
    if (qty > available) {
      saleFormError.textContent = `Only ${available} of "${name}" available in stock.`;
      newItemQty.focus();
      return;
    }
  }

  if (isNaN(price) || price < 0 || newItemPrice.value === "") {
    saleFormError.textContent = "Enter a price of ₦0 or more.";
    newItemPrice.focus();
    return;
  }

  saleFormError.textContent = "";
  saleCart.push({ name, qty, price, productId, costPrice });

  itemProductSelect.value = "";
  customItemName.hidden = true;
  customItemName.value = "";
  itemStockHint.textContent = "";
  itemStockHint.classList.remove("stock-hint-low");
  newItemQty.value = "1";
  newItemPrice.value = "";
  renderSaleCart();
  itemProductSelect.focus();
});

saleItemRows.addEventListener("click", (event) => {
  const btn = event.target.closest(".sale-item-remove");
  if (!btn) return;
  const index = Number(btn.dataset.index);
  saleCart.splice(index, 1);
  renderSaleCart();
});

saveSaleBtn.addEventListener("click", () => {
  if (saleCart.length === 0) {
    saleFormError.textContent = "Add at least one item before saving.";
    return;
  }

  const paymentType = salePaymentType.value === "Credit" ? "Credit" : "Paid";
  let customerId = null;
  let customerName = null;

  if (paymentType === "Credit") {
    if (!saleCustomerSelect.value) {
      saleFormError.textContent = "Please select a customer for a credit sale.";
      saleCustomerSelect.focus();
      return;
    }
    const customer = loadCustomers().find((c) => c.id === saleCustomerSelect.value);
    if (!customer) {
      saleFormError.textContent = "That customer no longer exists.";
      return;
    }
    customerId = customer.id;
    customerName = customer.name;
  } else {
    if (!paymentMethod.value) {
      saleFormError.textContent = "Select a payment method.";
      paymentMethod.focus();
      return;
    }
  }

  saleFormError.textContent = "";

  const sale = {
    id: Date.now().toString(),
    items: saleCart.slice(),
    total: computeSaleTotal(),
    paymentType,
    paymentMethod: paymentType === "Credit" ? null : paymentMethod.value,
    customerId,
    customerName,
    createdAt: new Date().toISOString()
  };

  addSale(sale);

  saleFormCard.hidden = true;
  resetSaleForm();
  renderSalesTodaySummary();
  renderSalesList();
  renderDashboard();
  openReceiptModal(sale.id, { justCompleted: true });
});

// ---- 8e. Sales: list and today's summary -----------------------------------------

function renderSalesTodaySummary() {
  const todaysSales = loadSales().filter((sale) => isToday(sale.createdAt));
  const total = todaysSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
  salesTodaySummary.textContent = `Today: ${formatNaira(total)} · ${todaysSales.length} sale${todaysSales.length === 1 ? "" : "s"}`;
}

function renderSalesList() {
  const sales = loadSales().slice().reverse(); // newest first

  if (sales.length === 0) {
    salesList.innerHTML = '<div class="sales-empty">No sales recorded yet. Tap "+ New Sale" to record your first one.</div>';
    return;
  }

  salesList.innerHTML = sales
    .map((sale) => {
      const itemsSummary = sale.items
        .map((item) => `${item.qty}x ${escapeHtml(item.name)}`)
        .join(", ");
      const dateLabel = new Date(sale.createdAt).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit"
      });

      const isCredit = sale.paymentType === "Credit";
      let paymentInfoHtml;

      if (isCredit) {
        const outstanding = sale.customerId ? getCustomerStats(sale.customerId).balance : sale.total;
        paymentInfoHtml = `
          <span class="sale-card-badge purchase-payment-credit">Credit${sale.customerName ? " · " + escapeHtml(sale.customerName) : ""}</span>
          <div class="purchase-notes">This customer currently owes: ${formatNaira(outstanding)}</div>
        `;
      } else {
        paymentInfoHtml = `<span class="sale-card-badge">${escapeHtml(sale.paymentMethod || "—")}</span>`;
      }

      return `
        <div class="sale-card">
          <div class="sale-card-top">
            <span class="sale-card-date">${dateLabel}</span>
            <span class="sale-card-total">${formatNaira(sale.total)}</span>
          </div>
          <div class="sale-card-items">${itemsSummary}</div>
          ${paymentInfoHtml}
          <div class="sale-card-actions">
            <button type="button" class="btn-secondary btn-compact view-receipt-btn" data-id="${sale.id}">View Receipt</button>
          </div>
        </div>
      `;
    })
    .join("");
}

salesList.addEventListener("click", (event) => {
  const btn = event.target.closest(".view-receipt-btn");
  if (!btn) return;
  openReceiptModal(btn.dataset.id, { justCompleted: false });
});

// ---- 8e2. Receipts: generated from an existing sale, view-only ---------------
// A receipt has NO financial effect — it only reads Sales, Customers, and
// Business data that already exist. Opening or printing one never touches
// Cash, Bank, Inventory, Profit, or any balance.

function loadReceiptNumbers() {
  const raw = localStorage.getItem(RECEIPT_NUMBERS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveReceiptNumbers(map) {
  localStorage.setItem(RECEIPT_NUMBERS_KEY, JSON.stringify(map));
}

// The same sale always gets the same receipt number: it's assigned once,
// the first time its receipt is viewed, then read from storage every time
// after that — never regenerated.
function getReceiptNumber(saleId) {
  const map = loadReceiptNumbers();
  if (map[saleId]) return map[saleId];

  const current = parseInt(localStorage.getItem(RECEIPT_COUNTER_KEY), 10) || 0;
  const next = current + 1;
  localStorage.setItem(RECEIPT_COUNTER_KEY, String(next));

  const number = "NBA-" + String(next).padStart(6, "0");
  map[saleId] = number;
  saveReceiptNumbers(map);
  return number;
}

function buildReceiptHtml(sale) {
  const business = loadBusiness() || {};
  const settings = loadSettings();
  const receiptNumber = getReceiptNumber(sale.id);
  const dateLabel = new Date(sale.createdAt).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  const customer = sale.customerId ? loadCustomers().find((c) => c.id === sale.customerId) : null;
  const isCredit = sale.paymentType === "Credit";
  const balanceDue = isCredit ? (sale.customerId ? getCustomerStats(sale.customerId).balance : sale.total) : 0;

  const headerName = settings.receiptHeaderName || business.businessName || "Your Business";
  const headerPhone = settings.receiptPhone || business.phone;
  const headerAddress = settings.receiptAddress || [business.address, business.state, business.country].filter(Boolean).join(", ");
  const footerText = settings.receiptFooter || "Thank you for your business.";

  const itemsHtml = sale.items
    .map(
      (item) => `
        <div class="receipt-item">
          <div class="receipt-item-name">${escapeHtml(item.name)}</div>
          <div class="receipt-item-line">
            <span>${item.qty} × ${formatNaira(item.price)}</span>
            <span>${formatNaira(item.qty * item.price)}</span>
          </div>
        </div>
      `
    )
    .join("");

  const paymentSectionHtml = isCredit
    ? `
        <div class="receipt-meta-row"><span>PAYMENT METHOD</span><span>CREDIT</span></div>
        ${
          balanceDue > 0
            ? `<div class="receipt-meta-row receipt-balance-due"><span>BALANCE DUE</span><span>${formatNaira(balanceDue)}</span></div>`
            : `<div class="receipt-paid-badge">✓ Paid in full</div>`
        }
      `
    : `
        <div class="receipt-meta-row"><span>PAYMENT METHOD</span><span>${escapeHtml((sale.paymentMethod || "—").toUpperCase())}</span></div>
        <div class="receipt-meta-row"><span>BALANCE DUE</span><span>₦0</span></div>
        <div class="receipt-paid-badge">✓ Paid in full</div>
      `;

  return `
    <div class="receipt-business">
      <div class="receipt-business-name">${escapeHtml(headerName)}</div>
      ${business.businessType ? `<div class="receipt-business-line">${escapeHtml(business.businessType)}</div>` : ""}
      ${headerAddress ? `<div class="receipt-business-line">${escapeHtml(headerAddress)}</div>` : ""}
      ${headerPhone ? `<div class="receipt-business-line">Phone: ${escapeHtml(headerPhone)}</div>` : ""}
    </div>

    <div class="receipt-divider"></div>

    <div class="receipt-meta">
      <div class="receipt-meta-row"><span>Receipt No</span><span>${escapeHtml(receiptNumber)}</span></div>
      <div class="receipt-meta-row"><span>Date</span><span>${dateLabel}</span></div>
      <div class="receipt-meta-row"><span>Customer</span><span>${escapeHtml(customer ? customer.name : "Walk-in Customer")}</span></div>
      ${customer && customer.phone ? `<div class="receipt-meta-row"><span>Phone</span><span>${escapeHtml(customer.phone)}</span></div>` : ""}
    </div>

    <div class="receipt-divider"></div>

    <div class="receipt-items">${itemsHtml}</div>

    <div class="receipt-divider"></div>

    <div class="receipt-meta-row receipt-total-row"><span>TOTAL</span><span>${formatNaira(sale.total)}</span></div>

    <div class="receipt-divider"></div>

    ${paymentSectionHtml}

    <div class="receipt-divider"></div>

    <div class="receipt-footer">${escapeHtml(footerText)}</div>
  `;
}

function openReceiptModal(saleId, opts) {
  opts = opts || {};
  const sale = loadSales().find((s) => s.id === saleId);

  receiptOverlay.hidden = false;
  receiptSuccessBanner.hidden = !opts.justCompleted;

  if (!sale) {
    receiptPaper.innerHTML = '<div class="receipt-error">Receipt unavailable: sale record not found.</div>';
    receiptNewSaleBtn.hidden = true;
    receiptPrintBtn.hidden = true;
    return;
  }

  receiptPaper.innerHTML = buildReceiptHtml(sale);
  receiptNewSaleBtn.hidden = !opts.justCompleted;
  receiptPrintBtn.hidden = false;
}

function closeReceiptModal() {
  receiptOverlay.hidden = true;
}

receiptCloseIconBtn.addEventListener("click", closeReceiptModal);
receiptCloseBtn.addEventListener("click", closeReceiptModal);
receiptPrintBtn.addEventListener("click", () => window.print());
receiptNewSaleBtn.addEventListener("click", () => {
  closeReceiptModal();
  openNewSaleForm();
});

// ---- 8f. Inventory: new product form -----------------------------------------

function resetProductForm() {
  productName.value = "";
  productCost.value = "";
  productPrice.value = "";
  productQty.value = "";
  productFormError.textContent = "";
}

function openNewProductForm() {
  resetProductForm();
  productFormCard.hidden = false;
  productName.focus();
}

newProductBtn.addEventListener("click", openNewProductForm);

cancelProductBtn.addEventListener("click", () => {
  productFormCard.hidden = true;
  resetProductForm();
});

saveProductBtn.addEventListener("click", () => {
  const name = productName.value.trim();
  const cost = Number(productCost.value);
  const price = Number(productPrice.value);
  const qty = productQty.value === "" ? 0 : Number(productQty.value);

  if (!name) {
    productFormError.textContent = "Enter a product name.";
    productName.focus();
    return;
  }
  if (productCost.value === "" || isNaN(cost) || cost < 0) {
    productFormError.textContent = "Enter a cost price of ₦0 or more.";
    productCost.focus();
    return;
  }
  if (productPrice.value === "" || isNaN(price) || price < 0) {
    productFormError.textContent = "Enter a selling price of ₦0 or more.";
    productPrice.focus();
    return;
  }
  if (isNaN(qty) || qty < 0) {
    productFormError.textContent = "Enter an opening quantity of 0 or more.";
    productQty.focus();
    return;
  }

  addProduct({
    id: Date.now().toString(),
    name,
    costPrice: cost,
    sellingPrice: price,
    quantity: qty,
    createdAt: new Date().toISOString()
  });

  productFormCard.hidden = true;
  resetProductForm();
  renderInventorySummary();
  renderProductList();
});

// ---- 8g. Inventory: manual Stock Adjustments (Module 21) -----------------------
// This replaces the old "Add Stock" shortcut, which used to change quantity
// directly with no record and no way to undo it. Every manual change now goes
// through createStockAdjustment()/reverseStockAdjustment() further up this
// file, so it always leaves a traceable, reversible record and never touches
// Purchase or Sale history.

let addStockProductId = null;

function openAddStockForm(id, name) {
  addStockProductId = id;
  addStockProductName.textContent = name;
  addStockType.value = "add";
  addStockQty.value = "1";
  addStockReason.value = "";
  addStockNote.value = "";
  addStockFormError.textContent = "";
  addStockFormCard.hidden = false;
  addStockQty.focus();
}

cancelAddStockBtn.addEventListener("click", () => {
  addStockFormCard.hidden = true;
  addStockProductId = null;
});

saveAddStockBtn.addEventListener("click", () => {
  const qty = Number(addStockQty.value);
  if (!qty || qty <= 0) {
    addStockFormError.textContent = "Enter a quantity of at least 1.";
    addStockQty.focus();
    return;
  }
  if (!addStockReason.value) {
    addStockFormError.textContent = "Select a reason for this adjustment.";
    addStockReason.focus();
    return;
  }

  const signedQty = addStockType.value === "remove" ? -qty : qty;
  const result = createStockAdjustment({
    productId: addStockProductId,
    qtyChange: signedQty,
    reason: addStockReason.value,
    note: addStockNote.value.trim()
  });

  if (!result.ok) {
    addStockFormError.textContent = result.error;
    return;
  }

  addStockFormCard.hidden = true;
  addStockProductId = null;
  renderInventorySummary();
  renderProductList();
  renderStockAdjustmentsList();
  renderDashboard();
});

// ---- 8h. Inventory: product list and value summary -----------------------------

function renderInventorySummary() {
  const products = loadInventory();
  const totalValue = computeInventoryValue();
  inventoryValueSummary.textContent =
    `Total stock value: ${formatNaira(totalValue)} · ${products.length} product${products.length === 1 ? "" : "s"}`;
}

function renderProductList() {
  const products = loadInventory().slice().reverse(); // newest first

  if (products.length === 0) {
    productList.innerHTML = '<div class="sales-empty">No products yet. Tap "+ New Product" to add your first one.</div>';
    return;
  }

  productList.innerHTML = products
    .map((p) => {
      const stockValue = (Number(p.quantity) || 0) * (Number(p.costPrice) || 0);
      return `
        <div class="sale-card">
          <div class="product-card-top">
            <span class="product-card-name">${escapeHtml(p.name)}</span>
            <span class="product-card-value">${formatNaira(stockValue)}</span>
          </div>
          <div class="product-card-meta">${p.quantity} in stock · Cost ${formatNaira(p.costPrice)} · Sell ${formatNaira(p.sellingPrice)}</div>
          <div class="product-card-actions">
            <button type="button" class="btn-secondary btn-compact add-stock-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}">Adjust Stock</button>
          </div>
        </div>
      `;
    })
    .join("");
}

productList.addEventListener("click", (event) => {
  const btn = event.target.closest(".add-stock-btn");
  if (!btn) return;
  openAddStockForm(btn.dataset.id, btn.dataset.name);
});

// ---- 8h2. Inventory: Stock Adjustment history (Module 21) ----------------------

function sortAdjustmentsForDisplay(adjustments) {
  return adjustments.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

const ADJUSTMENT_TYPE_LABELS = { addition: "Addition", removal: "Removal", reversal: "Reversal" };

function renderStockAdjustmentsList() {
  if (!stockAdjustmentList) return;
  const adjustments = sortAdjustmentsForDisplay(loadInventoryAdjustments());

  if (adjustments.length === 0) {
    stockAdjustmentList.innerHTML = '<div class="sales-empty">No stock adjustments recorded yet.</div>';
    return;
  }

  stockAdjustmentList.innerHTML = adjustments
    .map((a) => {
      const sign = a.qtyChange > 0 ? "+" : "";
      const badges = [`<span class="sale-card-badge">${escapeHtml(ADJUSTMENT_TYPE_LABELS[a.type] || a.type)}</span>`];
      if (a.reversed) badges.push('<span class="sale-card-badge purchase-payment-credit">Reversed</span>');
      const canReverse = !a.reversed && a.type !== "reversal";
      return `
        <div class="sale-card" data-id="${a.id}">
          <div class="sale-card-top">
            <span class="sale-card-date">${escapeHtml(a.adjustmentNumber)} · ${formatExpenseDate(a.date)}</span>
            <span class="sale-card-total">${sign}${a.qtyChange} units</span>
          </div>
          <div class="sale-card-items">${escapeHtml(a.productName)} — ${escapeHtml(a.reason)}${a.note ? " — " + escapeHtml(a.note) : ""}</div>
          <div class="product-card-meta">${a.previousQty} → ${a.newQty} units</div>
          <div class="product-card-actions">${badges.join(" ")}</div>
          ${canReverse ? `<div class="product-card-actions"><button type="button" class="btn-link btn-link-danger reverse-adjustment-btn" data-id="${a.id}">Reverse this adjustment</button></div>` : ""}
        </div>
      `;
    })
    .join("");
}

if (stockAdjustmentList) {
  stockAdjustmentList.addEventListener("click", (event) => {
    const btn = event.target.closest(".reverse-adjustment-btn");
    if (!btn) return;
    const confirmed = confirm("Reverse this stock adjustment? This will restore Inventory to the quantity before the adjustment.");
    if (!confirmed) return;

    const result = reverseStockAdjustment(btn.dataset.id);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    renderInventorySummary();
    renderProductList();
    renderStockAdjustmentsList();
    renderDashboard();
  });
}

// ---- 8i. Purchases: cart-based purchase entry -----------------------------------

let purchaseCart = [];

function computePurchaseTotal() {
  return purchaseCart.reduce((sum, item) => sum + item.qty * item.costPrice, 0);
}

function purchaseQtyAlreadyInCart(productId) {
  return purchaseCart
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + item.qty, 0);
}

function renderPurchaseCart() {
  if (purchaseCart.length === 0) {
    purchaseItemRows.innerHTML = '<p class="sale-empty-cart">No items added yet.</p>';
  } else {
    purchaseItemRows.innerHTML = purchaseCart
      .map((item, index) => `
        <div class="sale-item-row sale-item-row-entry">
          <span class="sale-item-name">${escapeHtml(item.name)}</span>
          <span class="sale-item-qty">${item.qty}</span>
          <span class="sale-item-price">${formatNaira(item.qty * item.costPrice)}</span>
          <button type="button" class="sale-item-remove" data-index="${index}" aria-label="Remove item">×</button>
        </div>
      `)
      .join("");
  }
  purchaseTotalValue.textContent = formatNaira(computePurchaseTotal());
}

// Fill supplier + product dropdowns with the latest data each time the form opens.
function populatePurchaseDropdowns() {
  const suppliers = loadSuppliers();
  purchaseSupplierSelect.innerHTML =
    '<option value="" disabled selected>Select supplier</option>' +
    suppliers.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");

  const products = loadInventory();
  purchaseProductSelect.innerHTML =
    '<option value="" disabled selected>Select product</option>' +
    products.map((p) => `<option value="${p.id}">${escapeHtml(p.name)} — ${p.quantity} in stock</option>`).join("");
}

purchaseProductSelect.addEventListener("change", () => {
  const product = loadInventory().find((p) => p.id === purchaseProductSelect.value);
  if (product) {
    purchaseItemCost.value = product.costPrice;
  }
});

function resetPurchaseForm() {
  purchaseCart = [];
  purchaseSupplierSelect.value = "";
  purchaseProductSelect.value = "";
  purchaseItemQty.value = "1";
  purchaseItemCost.value = "";
  purchasePaymentMethod.value = "";
  purchaseNotes.value = "";
  purchaseFormError.textContent = "";
  renderPurchaseCart();
}

function openNewPurchaseForm() {
  resetPurchaseForm();
  purchaseFormCard.hidden = false;

  // Connected Purchase Workflow: suppliers and products can now be created
  // inline via the "+ New" buttons below, so we no longer block the form
  // when either list is empty — the user never has to leave Purchases.
  purchasePrereqMessage.hidden = true;
  purchaseFormBody.hidden = false;
  populatePurchaseDropdowns();
  purchaseSupplierSelect.focus();
}

newPurchaseBtn.addEventListener("click", openNewPurchaseForm);

cancelPurchaseBtn.addEventListener("click", () => {
  purchaseFormCard.hidden = true;
  resetPurchaseForm();
});

purchaseAddItemBtn.addEventListener("click", () => {
  const productId = purchaseProductSelect.value;
  const qty = Number(purchaseItemQty.value);
  const costPrice = Number(purchaseItemCost.value);

  if (!productId) {
    purchaseFormError.textContent = "Select a product.";
    purchaseProductSelect.focus();
    return;
  }
  const product = loadInventory().find((p) => p.id === productId);
  if (!product) {
    purchaseFormError.textContent = "That product no longer exists in Inventory.";
    return;
  }
  if (!qty || qty <= 0) {
    purchaseFormError.textContent = "Enter a quantity of at least 1.";
    purchaseItemQty.focus();
    return;
  }
  if (isNaN(costPrice) || costPrice < 0 || purchaseItemCost.value === "") {
    purchaseFormError.textContent = "Enter a cost price of ₦0 or more.";
    purchaseItemCost.focus();
    return;
  }

  purchaseFormError.textContent = "";
  purchaseCart.push({ productId, name: product.name, qty, costPrice });

  purchaseProductSelect.value = "";
  purchaseItemQty.value = "1";
  purchaseItemCost.value = "";
  renderPurchaseCart();
  purchaseProductSelect.focus();
});

purchaseItemRows.addEventListener("click", (event) => {
  const btn = event.target.closest(".sale-item-remove");
  if (!btn) return;
  const index = Number(btn.dataset.index);
  purchaseCart.splice(index, 1);
  renderPurchaseCart();
});

let purchaseConfirmExecuting = false;
let pendingPurchaseDraft = null;

savePurchaseBtn.addEventListener("click", () => {
  if (!purchaseSupplierSelect.value) {
    purchaseFormError.textContent = "Select a supplier.";
    purchaseSupplierSelect.focus();
    return;
  }
  if (purchaseCart.length === 0) {
    purchaseFormError.textContent = "Add at least one item before saving.";
    return;
  }
  if (!purchasePaymentMethod.value) {
    purchaseFormError.textContent = "Select a payment method.";
    purchasePaymentMethod.focus();
    return;
  }

  purchaseFormError.textContent = "";

  const supplier = loadSuppliers().find((s) => s.id === purchaseSupplierSelect.value);
  pendingPurchaseDraft = {
    supplierId: purchaseSupplierSelect.value,
    supplierName: supplier ? supplier.name : "Unknown supplier",
    items: purchaseCart.slice(),
    total: computePurchaseTotal(),
    paymentMethod: purchasePaymentMethod.value,
    notes: purchaseNotes.value.trim()
  };

  openPurchaseConfirmModal(pendingPurchaseDraft);
});

// ---- 8i1b. Purchases: confirmation modal ----------------------------------------

function openPurchaseConfirmModal(draft) {
  purchaseConfirmSupplier.textContent = draft.supplierName;
  purchaseConfirmItems.innerHTML = draft.items
    .map(
      (item) =>
        `<div class="purchase-confirm-item-row">
          <span class="purchase-confirm-item-name">${item.qty} × ${escapeHtml(item.name)}</span>
          <span class="purchase-confirm-item-value">${formatNaira(item.qty * item.costPrice)}</span>
        </div>`
    )
    .join("");
  purchaseConfirmTotal.textContent = formatNaira(draft.total);
  purchaseConfirmPayment.textContent = draft.paymentMethod === "Credit" ? "Credit / Pay Later" : draft.paymentMethod;

  purchaseConfirmExecuting = false;
  purchaseConfirmSaveBtn.disabled = false;
  purchaseConfirmSaveBtn.textContent = "Confirm Purchase";
  purchaseConfirmOverlay.hidden = false;
}

function closePurchaseConfirmModal() {
  purchaseConfirmOverlay.hidden = true;
}

purchaseConfirmCancelBtn.addEventListener("click", () => {
  pendingPurchaseDraft = null;
  closePurchaseConfirmModal();
});

purchaseConfirmSaveBtn.addEventListener("click", () => {
  // Guard against double taps / repeated clicks firing this twice.
  if (purchaseConfirmExecuting || !pendingPurchaseDraft) return;
  purchaseConfirmExecuting = true;
  purchaseConfirmSaveBtn.disabled = true;
  purchaseConfirmSaveBtn.textContent = "Saving…";

  const draft = pendingPurchaseDraft;
  pendingPurchaseDraft = null;

  const purchaseNumber = "PUR-" + String(loadPurchases().length + 1).padStart(4, "0");
  const purchase = {
    id: Date.now().toString(),
    purchaseNumber,
    supplierId: draft.supplierId,
    supplierName: draft.supplierName,
    items: draft.items,
    total: draft.total,
    paymentMethod: draft.paymentMethod,
    notes: draft.notes,
    createdAt: new Date().toISOString()
  };

  addPurchase(purchase);

  closePurchaseConfirmModal();
  purchaseFormCard.hidden = true;
  resetPurchaseForm();
  renderPurchasesTodaySummary();
  renderPurchaseList();
  renderInventorySummary();
  renderProductList();
  renderDashboard();

  purchaseConfirmExecuting = false;
});

// ---- 8i1c. Purchases: quick-create supplier (inline, no leaving Purchases) ------

function resetQuickSupplierForm() {
  pqSupplierName.value = "";
  pqSupplierPhone.value = "";
  pqSupplierEmail.value = "";
  pqSupplierAddress.value = "";
  pqSupplierNotes.value = "";
  pqSupplierFormError.textContent = "";
  pqSupplierDuplicateBox.hidden = true;
  pqSupplierMainActions.hidden = false;
}

function exactNameMatch(list, name) {
  const q = (name || "").trim().toLowerCase();
  if (!q) return null;
  return list.find((item) => (item.name || "").trim().toLowerCase() === q) || null;
}

function openQuickSupplierModal() {
  resetQuickSupplierForm();
  purchaseQuickSupplierOverlay.hidden = false;
  pqSupplierName.focus();
}

function closeQuickSupplierModal() {
  purchaseQuickSupplierOverlay.hidden = true;
}

function selectSupplierInPurchaseForm(supplierId) {
  populatePurchaseDropdowns();
  purchaseSupplierSelect.value = supplierId;
}

purchaseNewSupplierBtn.addEventListener("click", openQuickSupplierModal);
purchaseQuickSupplierCloseBtn.addEventListener("click", closeQuickSupplierModal);
pqSupplierCancelBtn.addEventListener("click", closeQuickSupplierModal);

function createSupplierNow() {
  const name = pqSupplierName.value.trim();
  const email = pqSupplierEmail.value.trim();
  const supplier = {
    id: Date.now().toString(),
    name,
    phone: pqSupplierPhone.value.trim(),
    email,
    address: pqSupplierAddress.value.trim(),
    notes: pqSupplierNotes.value.trim(),
    createdAt: new Date().toISOString()
  };
  addSupplier(supplier);
  closeQuickSupplierModal();
  selectSupplierInPurchaseForm(supplier.id);
  renderSuppliersSummary();
  renderSupplierList();
}

pqSupplierCreateBtn.addEventListener("click", () => {
  const name = pqSupplierName.value.trim();
  const email = pqSupplierEmail.value.trim();

  if (!name) {
    pqSupplierFormError.textContent = "Enter a supplier name.";
    pqSupplierName.focus();
    return;
  }
  if (email && !isValidEmail(email)) {
    pqSupplierFormError.textContent = "Enter a valid email, or leave it blank.";
    pqSupplierEmail.focus();
    return;
  }
  pqSupplierFormError.textContent = "";

  const duplicate = exactNameMatch(loadSuppliers(), name);
  if (duplicate) {
    pqSupplierDuplicateText.textContent = `A supplier named "${duplicate.name}" already exists. Use the existing one, or create a new supplier with the same name anyway.`;
    pqSupplierDuplicateBox.hidden = false;
    pqSupplierMainActions.hidden = true;
    pqSupplierUseExistingBtn.onclick = () => {
      closeQuickSupplierModal();
      selectSupplierInPurchaseForm(duplicate.id);
    };
    pqSupplierCreateAnywayBtn.onclick = () => {
      createSupplierNow();
    };
    return;
  }

  createSupplierNow();
});

// ---- 8i1d. Purchases: quick-create product (inline, no leaving Purchases) -------

function resetQuickProductForm() {
  pqProductName.value = "";
  pqProductCost.value = "";
  pqProductPrice.value = "";
  pqProductQty.value = "0";
  pqProductFormError.textContent = "";
  pqProductDuplicateBox.hidden = true;
  pqProductMainActions.hidden = false;
}

function openQuickProductModal() {
  resetQuickProductForm();
  purchaseQuickProductOverlay.hidden = false;
  pqProductName.focus();
}

function closeQuickProductModal() {
  purchaseQuickProductOverlay.hidden = true;
}

function selectProductInPurchaseForm(productId) {
  populatePurchaseDropdowns();
  purchaseProductSelect.value = productId;
  const product = loadInventory().find((p) => p.id === productId);
  if (product) purchaseItemCost.value = product.costPrice;
}

purchaseNewProductBtn.addEventListener("click", openQuickProductModal);
purchaseQuickProductCloseBtn.addEventListener("click", closeQuickProductModal);
pqProductCancelBtn.addEventListener("click", closeQuickProductModal);

function createProductNow() {
  const name = pqProductName.value.trim();
  const cost = Number(pqProductCost.value);
  const price = Number(pqProductPrice.value);
  const qty = pqProductQty.value === "" ? 0 : Number(pqProductQty.value);

  const product = {
    id: Date.now().toString(),
    name,
    costPrice: cost,
    sellingPrice: price,
    quantity: qty,
    createdAt: new Date().toISOString()
  };
  addProduct(product);
  closeQuickProductModal();
  selectProductInPurchaseForm(product.id);
  renderInventorySummary();
  renderProductList();
}

pqProductCreateBtn.addEventListener("click", () => {
  const name = pqProductName.value.trim();
  const cost = Number(pqProductCost.value);
  const price = Number(pqProductPrice.value);
  const qty = pqProductQty.value === "" ? 0 : Number(pqProductQty.value);

  if (!name) {
    pqProductFormError.textContent = "Enter a product name.";
    pqProductName.focus();
    return;
  }
  if (pqProductCost.value === "" || isNaN(cost) || cost < 0) {
    pqProductFormError.textContent = "Enter a cost price of ₦0 or more.";
    pqProductCost.focus();
    return;
  }
  if (pqProductPrice.value === "" || isNaN(price) || price < 0) {
    pqProductFormError.textContent = "Enter a selling price of ₦0 or more.";
    pqProductPrice.focus();
    return;
  }
  if (isNaN(qty) || qty < 0) {
    pqProductFormError.textContent = "Enter an opening quantity of 0 or more.";
    pqProductQty.focus();
    return;
  }
  pqProductFormError.textContent = "";

  const duplicate = exactNameMatch(loadInventory(), name);
  if (duplicate) {
    pqProductDuplicateText.textContent = `A product named "${duplicate.name}" already exists (${duplicate.quantity} in stock). Use the existing one, or create a new product with the same name anyway.`;
    pqProductDuplicateBox.hidden = false;
    pqProductMainActions.hidden = true;
    pqProductUseExistingBtn.onclick = () => {
      closeQuickProductModal();
      selectProductInPurchaseForm(duplicate.id);
    };
    pqProductCreateAnywayBtn.onclick = () => {
      createProductNow();
    };
    return;
  }

  createProductNow();
});

// ---- 8i2. Purchases: history list ------------------------------------------------

function renderPurchasesTodaySummary() {
  const todaysPurchases = loadPurchases().filter((p) => isToday(p.createdAt));
  const total = todaysPurchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  purchasesTodaySummary.textContent = `Today: ${formatNaira(total)} · ${todaysPurchases.length} purchase${todaysPurchases.length === 1 ? "" : "s"}`;
}

let expandedPurchaseId = null;

function renderPurchaseList() {
  const purchases = loadPurchases().slice().reverse(); // newest first

  if (purchases.length === 0) {
    purchaseList.innerHTML = '<div class="sales-empty">No purchases recorded yet. Tap "+ New Purchase" to record your first one.</div>';
    return;
  }

  purchaseList.innerHTML = purchases
    .map((p) => {
      const dateLabel = new Date(p.createdAt).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit"
      });
      const badgeClass = p.paymentMethod === "Credit" ? "sale-card-badge purchase-payment-credit" : "sale-card-badge";
      const isExpanded = p.id === expandedPurchaseId;

      const detailHtml = isExpanded
        ? `
          <div class="purchase-item-detail">
            ${p.items
              .map(
                (item) => `
              <div class="purchase-item-detail-row">
                <span>${item.qty}x ${escapeHtml(item.name)}</span>
                <span>${formatNaira(item.qty * item.costPrice)}</span>
              </div>
            `
              )
              .join("")}
          </div>
          ${p.notes ? `<div class="purchase-notes">${escapeHtml(p.notes)}</div>` : ""}
        `
        : "";

      return `
        <div class="sale-card purchase-card" data-id="${p.id}">
          <div class="sale-card-top">
            <span class="sale-card-date">${escapeHtml(p.purchaseNumber)} · ${dateLabel}</span>
            <span class="sale-card-total">${formatNaira(p.total)}</span>
          </div>
          <div class="sale-card-items">${escapeHtml(p.supplierName)}</div>
          <span class="${badgeClass}">${escapeHtml(p.paymentMethod === "Credit" ? "Credit / Pay Later" : p.paymentMethod)}</span>
          ${detailHtml}
        </div>
      `;
    })
    .join("");
}

purchaseList.addEventListener("click", (event) => {
  const card = event.target.closest(".purchase-card");
  if (!card) return;
  expandedPurchaseId = expandedPurchaseId === card.dataset.id ? null : card.dataset.id;
  renderPurchaseList();
});

// ---- 8j. Suppliers: add supplier form ------------------------------------------

function resetSupplierForm() {
  supplierName.value = "";
  supplierPhone.value = "";
  supplierEmail.value = "";
  supplierAddress.value = "";
  supplierNotes.value = "";
  supplierFormError.textContent = "";
}

function openNewSupplierForm() {
  resetSupplierForm();
  supplierFormCard.hidden = false;
  supplierName.focus();
}

newSupplierBtn.addEventListener("click", openNewSupplierForm);

cancelSupplierBtn.addEventListener("click", () => {
  supplierFormCard.hidden = true;
  resetSupplierForm();
});

saveSupplierBtn.addEventListener("click", () => {
  const name = supplierName.value.trim();
  const phone = supplierPhone.value.trim();
  const email = supplierEmail.value.trim();

  if (!name) {
    supplierFormError.textContent = "Enter a supplier name.";
    supplierName.focus();
    return;
  }
  if (email && !isValidEmail(email)) {
    supplierFormError.textContent = "Enter a valid email, or leave it blank.";
    supplierEmail.focus();
    return;
  }

  addSupplier({
    id: Date.now().toString(),
    name,
    phone,
    email,
    address: supplierAddress.value.trim(),
    notes: supplierNotes.value.trim(),
    createdAt: new Date().toISOString()
  });

  supplierFormCard.hidden = true;
  resetSupplierForm();
  renderSuppliersSummary();
  renderSupplierList();
});

// ---- 8k. Suppliers: list view and detail/statement view -----------------------

function showSuppliersListView() {
  suppliersListView.hidden = false;
  supplierDetailView.hidden = true;
  renderSuppliersSummary();
  renderSupplierList();
}

let currentSupplierId = null;

function showSupplierDetailView(supplierId) {
  const supplier = loadSuppliers().find((s) => s.id === supplierId);
  if (!supplier) {
    showSuppliersListView();
    return;
  }

  currentSupplierId = supplierId;
  suppliersListView.hidden = true;
  supplierDetailView.hidden = false;
  supplierPaymentFormCard.hidden = true;

  supplierDetailName.textContent = supplier.name;
  supplierDetailContact.textContent = [supplier.phone, supplier.email].filter(Boolean).join(" · ") || "No contact details";
  paymentSupplierName.textContent = supplier.name;

  renderSupplierStatement(supplierId);
}

function renderSupplierStatement(supplierId) {
  const stats = getSupplierStats(supplierId);
  supplierStatTotal.textContent = formatNaira(stats.total);
  supplierStatPaid.textContent = formatNaira(stats.paid);
  supplierStatOwed.textContent = formatNaira(stats.owed);

  // Every purchase shows on the statement (so the full buying history stays
  // visible), but only Credit purchases and payments move the running
  // balance — Cash/Bank purchases were already settled the moment they
  // happened, just like on the Customer statement.
  const entries = stats.purchases
    .map((p) => ({
      date: p.createdAt,
      label: p.paymentMethod === "Credit" ? "Credit Purchase " + p.purchaseNumber : "Purchase " + p.purchaseNumber + " (" + p.paymentMethod + ")",
      debit: p.paymentMethod === "Credit" ? Number(p.total) || 0 : 0,
      credit: 0
    }))
    .concat(
      stats.payments.map((pay) => ({
        date: pay.createdAt,
        label: "Payment — " + pay.paymentMethod,
        debit: 0,
        credit: Number(pay.amount) || 0
      }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (entries.length === 0) {
    supplierStatement.innerHTML = '<div class="sales-empty">No purchases recorded from this supplier yet.</div>';
    return;
  }

  let runningBalance = 0;
  supplierStatement.innerHTML = entries
    .map((entry) => {
      runningBalance += entry.debit - entry.credit;
      const dateLabel = new Date(entry.date).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      return `
        <div class="statement-row">
          <span class="statement-row-desc">${escapeHtml(entry.label)}</span>
          <span class="statement-row-balance">${formatNaira(runningBalance)}</span>
          <span class="statement-row-date">${dateLabel}</span>
          <div class="statement-row-amounts">
            <span>Debit: ${entry.debit ? formatNaira(entry.debit) : "—"}</span>
            <span>Credit: ${entry.credit ? formatNaira(entry.credit) : "—"}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

backToSuppliersBtn.addEventListener("click", showSuppliersListView);

// ---- 8k2. Suppliers: record payment ----------------------------------------------

function resetSupplierPaymentForm() {
  supplierPaymentDate.value = todayDateValue();
  supplierPaymentAmount.value = "";
  supplierPaymentMethod.value = "";
  supplierPaymentNote.value = "";
  supplierPaymentFormError.textContent = "";
}

newSupplierPaymentBtn.addEventListener("click", () => {
  resetSupplierPaymentForm();
  supplierPaymentFormCard.hidden = false;
  supplierPaymentAmount.focus();
});

cancelSupplierPaymentBtn.addEventListener("click", () => {
  supplierPaymentFormCard.hidden = true;
  resetSupplierPaymentForm();
});

saveSupplierPaymentBtn.addEventListener("click", () => {
  const dateVal = supplierPaymentDate.value;
  const amount = Number(supplierPaymentAmount.value);
  const method = supplierPaymentMethod.value;
  const note = supplierPaymentNote.value.trim();

  if (!dateVal) {
    supplierPaymentFormError.textContent = "Select a valid date.";
    supplierPaymentDate.focus();
    return;
  }
  if (supplierPaymentAmount.value === "" || isNaN(amount) || amount <= 0) {
    supplierPaymentFormError.textContent = "Enter an amount greater than ₦0.";
    supplierPaymentAmount.focus();
    return;
  }
  if (!method) {
    supplierPaymentFormError.textContent = "Select a payment method.";
    supplierPaymentMethod.focus();
    return;
  }

  const stats = getSupplierStats(currentSupplierId);
  if (stats.owed <= 0) {
    supplierPaymentFormError.textContent = "This supplier has no outstanding balance.";
    return;
  }
  if (amount > stats.owed) {
    supplierPaymentFormError.textContent = "Payment cannot exceed the supplier's outstanding balance.";
    supplierPaymentAmount.focus();
    return;
  }

  addSupplierPayment({
    id: Date.now().toString(),
    supplierId: currentSupplierId,
    date: dateVal,
    amount,
    paymentMethod: method,
    note,
    createdAt: new Date().toISOString()
  });

  supplierPaymentFormCard.hidden = true;
  resetSupplierPaymentForm();
  renderSupplierStatement(currentSupplierId);
  renderDashboard();
});


function renderSuppliersSummary() {
  const suppliers = loadSuppliers();
  suppliersSummary.textContent = `${suppliers.length} supplier${suppliers.length === 1 ? "" : "s"}`;
}

function renderSupplierList() {
  const suppliers = loadSuppliers().slice().reverse(); // newest first

  if (suppliers.length === 0) {
    supplierList.innerHTML = '<div class="sales-empty">No suppliers yet. Tap "+ Add Supplier" to add your first one.</div>';
    return;
  }

  supplierList.innerHTML = suppliers
    .map((s) => {
      const stats = getSupplierStats(s.id);
      const statusHtml = stats.owed > 0
        ? `<span class="sale-card-badge purchase-payment-credit">Owes ${formatNaira(stats.owed)}</span>`
        : `<span class="sale-card-badge">Paid · ₦0 owed</span>`;
      return `
        <div class="sale-card supplier-card" data-id="${s.id}">
          <div class="sale-card-top">
            <span class="supplier-card-name">${escapeHtml(s.name)}</span>
          </div>
          <div class="supplier-card-phone">${escapeHtml(s.phone || "No phone number")}</div>
          <div class="supplier-card-stats">
            <span>Purchases: <strong>${formatNaira(stats.total)}</strong></span>
          </div>
          ${statusHtml}
        </div>
      `;
    })
    .join("");
}

supplierList.addEventListener("click", (event) => {
  const card = event.target.closest(".supplier-card");
  if (!card) return;
  showSupplierDetailView(card.dataset.id);
});

// ---- 8l. Expenses: new/edit expense form -----------------------------------

let editingExpenseId = null;
let expandedExpenseId = null;

function resetExpenseForm() {
  editingExpenseId = null;
  expenseDate.value = todayDateValue();
  expenseCategory.value = "";
  expenseDescription.value = "";
  expenseAmount.value = "";
  expensePaymentMethod.value = "";
  expenseNote.value = "";
  expenseFormError.textContent = "";
  expenseFormTitle.textContent = "New expense";
  saveExpenseBtn.textContent = "Save Expense";
}

function openNewExpenseForm() {
  resetExpenseForm();
  expenseFormCard.hidden = false;
  expenseCategory.focus();
}

function openEditExpenseForm(id) {
  const expense = loadExpenses().find((e) => e.id === id);
  if (!expense) return;

  editingExpenseId = id;
  expenseDate.value = expense.date;
  expenseCategory.value = expense.category;
  expenseDescription.value = expense.description || "";
  expenseAmount.value = expense.amount;
  expensePaymentMethod.value = expense.paymentMethod;
  expenseNote.value = expense.note || "";
  expenseFormError.textContent = "";
  expenseFormTitle.textContent = "Edit expense";
  saveExpenseBtn.textContent = "Update Expense";

  expenseFormCard.hidden = false;
  expenseFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

newExpenseBtn.addEventListener("click", openNewExpenseForm);

cancelExpenseBtn.addEventListener("click", () => {
  expenseFormCard.hidden = true;
  resetExpenseForm();
});

saveExpenseBtn.addEventListener("click", () => {
  const dateVal = expenseDate.value;
  const category = expenseCategory.value;
  const description = expenseDescription.value.trim();
  const amount = Number(expenseAmount.value);
  const method = expensePaymentMethod.value;
  const note = expenseNote.value.trim();

  if (!dateVal) {
    expenseFormError.textContent = "Select a valid date.";
    expenseDate.focus();
    return;
  }
  if (!category) {
    expenseFormError.textContent = "Select an expense category.";
    expenseCategory.focus();
    return;
  }
  if (category === "Other" && !description) {
    expenseFormError.textContent = 'Enter a description for this "Other" expense.';
    expenseDescription.focus();
    return;
  }
  if (expenseAmount.value === "" || isNaN(amount) || amount <= 0) {
    expenseFormError.textContent = "Enter an amount greater than ₦0.";
    expenseAmount.focus();
    return;
  }
  if (!method) {
    expenseFormError.textContent = "Select a payment method.";
    expensePaymentMethod.focus();
    return;
  }

  expenseFormError.textContent = "";

  if (editingExpenseId) {
    updateExpense(editingExpenseId, {
      date: dateVal,
      category,
      description,
      amount,
      paymentMethod: method,
      note
    });
  } else {
    addExpense({
      id: Date.now().toString(),
      expenseNumber: nextExpenseNumber(),
      date: dateVal,
      category,
      description,
      amount,
      paymentMethod: method,
      note,
      createdAt: new Date().toISOString()
    });
  }

  expenseFormCard.hidden = true;
  resetExpenseForm();
  renderExpensesTodaySummary();
  renderExpenseList();
  renderDashboard();
});

// ---- 8m. Expenses: history list, details, edit & delete --------------------

function renderExpensesTodaySummary() {
  const todaysExpenses = loadExpenses().filter(isExpenseToday);
  const total = todaysExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  expensesTodaySummary.textContent =
    `Today: ${formatNaira(total)} · ${todaysExpenses.length} expense${todaysExpenses.length === 1 ? "" : "s"}`;
}

// Sorted by the expense's own Date first (not when it was entered), so a
// backdated expense still lands in the right place in the history.
function sortExpensesForDisplay(expenses) {
  return expenses.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function formatExpenseDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function renderExpenseList() {
  const expenses = sortExpensesForDisplay(loadExpenses());

  if (expenses.length === 0) {
    expenseList.innerHTML = '<div class="sales-empty">No expenses recorded yet. Tap "+ New Expense" to record your first one.</div>';
    return;
  }

  expenseList.innerHTML = expenses
    .map((e) => {
      const dateLabel = formatExpenseDate(e.date);
      const isExpanded = e.id === expandedExpenseId;

      const detailHtml = isExpanded
        ? `
          <div class="purchase-item-detail">
            <div class="purchase-item-detail-row"><span>Expense ID</span><span>${escapeHtml(e.expenseNumber)}</span></div>
            <div class="purchase-item-detail-row"><span>Date</span><span>${dateLabel}</span></div>
            <div class="purchase-item-detail-row"><span>Category</span><span>${escapeHtml(e.category)}</span></div>
            <div class="purchase-item-detail-row"><span>Description</span><span>${escapeHtml(e.description || "—")}</span></div>
            <div class="purchase-item-detail-row"><span>Amount</span><span>${formatNaira(e.amount)}</span></div>
            <div class="purchase-item-detail-row"><span>Payment method</span><span>${escapeHtml(e.paymentMethod)}</span></div>
            ${e.note ? `<div class="purchase-notes">Note: ${escapeHtml(e.note)}</div>` : ""}
            <div class="expense-detail-actions">
              <button type="button" class="btn-secondary btn-compact edit-expense-btn" data-id="${e.id}">Edit</button>
              <button type="button" class="btn-link btn-link-danger expense-delete-btn" data-id="${e.id}">Delete</button>
            </div>
          </div>
        `
        : "";

      return `
        <div class="sale-card expense-card" data-id="${e.id}">
          <div class="sale-card-top">
            <span class="sale-card-date">${escapeHtml(e.expenseNumber)} · ${dateLabel}</span>
            <span class="sale-card-total">${formatNaira(e.amount)}</span>
          </div>
          <div class="sale-card-items">${escapeHtml(e.category)}${e.description ? " — " + escapeHtml(e.description) : ""}</div>
          <span class="sale-card-badge">${escapeHtml(e.paymentMethod)}</span>
          ${detailHtml}
        </div>
      `;
    })
    .join("");
}

function handleDeleteExpense(id) {
  const confirmed = confirm("Delete this expense? This will reverse its effect on your Cash/Bank balance.");
  if (!confirmed) return;

  deleteExpense(id);
  if (expandedExpenseId === id) expandedExpenseId = null;

  renderExpensesTodaySummary();
  renderExpenseList();
  renderDashboard();
}

expenseList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".edit-expense-btn");
  if (editButton) {
    openEditExpenseForm(editButton.dataset.id);
    return;
  }

  const deleteButton = event.target.closest(".expense-delete-btn");
  if (deleteButton) {
    handleDeleteExpense(deleteButton.dataset.id);
    return;
  }

  const card = event.target.closest(".expense-card");
  if (!card) return;
  expandedExpenseId = expandedExpenseId === card.dataset.id ? null : card.dataset.id;
  renderExpenseList();
});

// ---- 8m2. Drawings: form, save, and validation -------------------------------

let editingDrawingId = null;
let expandedDrawingId = null;

function resetDrawingForm() {
  editingDrawingId = null;
  drawingDate.value = todayDateValue();
  drawingReason.value = "";
  drawingDescription.value = "";
  drawingAmount.value = "";
  drawingPaymentMethod.value = "";
  drawingNote.value = "";
  drawingFormError.textContent = "";
  drawingFormTitle.textContent = "New drawing";
  saveDrawingBtn.textContent = "Save Drawing";
}

function openNewDrawingForm() {
  resetDrawingForm();
  drawingFormCard.hidden = false;
  drawingReason.focus();
}

function openEditDrawingForm(id) {
  const drawing = loadDrawings().find((d) => d.id === id);
  if (!drawing) return;

  editingDrawingId = id;
  drawingDate.value = drawing.date;
  drawingReason.value = drawing.reason;
  drawingDescription.value = drawing.description || "";
  drawingAmount.value = drawing.amount;
  drawingPaymentMethod.value = drawing.paymentMethod;
  drawingNote.value = drawing.note || "";
  drawingFormError.textContent = "";
  drawingFormTitle.textContent = "Edit drawing";
  saveDrawingBtn.textContent = "Update Drawing";

  drawingFormCard.hidden = false;
  drawingFormCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

newDrawingBtn.addEventListener("click", openNewDrawingForm);

cancelDrawingBtn.addEventListener("click", () => {
  drawingFormCard.hidden = true;
  resetDrawingForm();
});

saveDrawingBtn.addEventListener("click", () => {
  const dateVal = drawingDate.value;
  const reason = drawingReason.value;
  const description = drawingDescription.value.trim();
  const amount = Number(drawingAmount.value);
  const method = drawingPaymentMethod.value;
  const note = drawingNote.value.trim();

  if (!dateVal) {
    drawingFormError.textContent = "Select a valid date.";
    drawingDate.focus();
    return;
  }
  if (!reason) {
    drawingFormError.textContent = "Select a reason.";
    drawingReason.focus();
    return;
  }
  if (reason === "Other" && !description) {
    drawingFormError.textContent = 'Enter a description for this "Other" drawing.';
    drawingDescription.focus();
    return;
  }
  if (drawingAmount.value === "" || isNaN(amount) || amount <= 0) {
    drawingFormError.textContent = "Enter an amount greater than ₦0.";
    drawingAmount.focus();
    return;
  }
  if (!method) {
    drawingFormError.textContent = "Select a payment method.";
    drawingPaymentMethod.focus();
    return;
  }

  // A drawing can never push Cash or Bank negative.
  const available = availableBalanceForDrawing(method, editingDrawingId);
  if (amount > available) {
    drawingFormError.textContent = `Insufficient ${method.toLowerCase()} balance for this drawing.`;
    drawingAmount.focus();
    return;
  }

  drawingFormError.textContent = "";

  if (editingDrawingId) {
    updateDrawing(editingDrawingId, {
      date: dateVal,
      reason,
      description,
      amount,
      paymentMethod: method,
      note
    });
  } else {
    addDrawing({
      id: Date.now().toString(),
      drawingNumber: nextDrawingNumber(),
      date: dateVal,
      reason,
      description,
      amount,
      paymentMethod: method,
      note,
      createdAt: new Date().toISOString()
    });
  }

  drawingFormCard.hidden = true;
  resetDrawingForm();
  renderDrawingsTodaySummary();
  renderDrawingsStatGrid();
  renderDrawingList();
  renderDashboard();
});

// ---- 8m3. Drawings: history list, details, edit & delete ---------------------

function renderDrawingsTodaySummary() {
  const todaysDrawings = loadDrawings().filter(isDrawingToday);
  const total = todaysDrawings.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  drawingsTodaySummary.textContent =
    `Today: ${formatNaira(total)} · ${todaysDrawings.length} drawing${todaysDrawings.length === 1 ? "" : "s"}`;
}

function renderDrawingsStatGrid() {
  drawingsStatTotal.textContent = formatNaira(computeTotalDrawings());
  drawingsStatCash.textContent = formatNaira(computeCashDrawings());
  drawingsStatBank.textContent = formatNaira(computeBankDrawings());
}

// Sorted by the drawing's own Date first (not when it was entered), so a
// backdated drawing still lands in the right place in the history.
function sortDrawingsForDisplay(drawings) {
  return drawings.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function renderDrawingList() {
  const drawings = sortDrawingsForDisplay(loadDrawings());

  if (drawings.length === 0) {
    drawingList.innerHTML = '<div class="sales-empty">No drawings recorded yet. Tap "+ New Drawing" to record your first one.</div>';
    return;
  }

  drawingList.innerHTML = drawings
    .map((d) => {
      const dateLabel = formatExpenseDate(d.date);
      const isExpanded = d.id === expandedDrawingId;

      const detailHtml = isExpanded
        ? `
          <div class="purchase-item-detail">
            <div class="purchase-item-detail-row"><span>Drawing ID</span><span>${escapeHtml(d.drawingNumber)}</span></div>
            <div class="purchase-item-detail-row"><span>Date</span><span>${dateLabel}</span></div>
            <div class="purchase-item-detail-row"><span>Reason</span><span>${escapeHtml(d.reason)}</span></div>
            <div class="purchase-item-detail-row"><span>Description</span><span>${escapeHtml(d.description || "—")}</span></div>
            <div class="purchase-item-detail-row"><span>Amount</span><span>${formatNaira(d.amount)}</span></div>
            <div class="purchase-item-detail-row"><span>Payment method</span><span>${escapeHtml(d.paymentMethod)}</span></div>
            ${d.note ? `<div class="purchase-notes">Note: ${escapeHtml(d.note)}</div>` : ""}
            <div class="expense-detail-actions">
              <button type="button" class="btn-secondary btn-compact edit-drawing-btn" data-id="${d.id}">Edit</button>
              <button type="button" class="btn-link btn-link-danger drawing-delete-btn" data-id="${d.id}">Delete</button>
            </div>
          </div>
        `
        : "";

      return `
        <div class="sale-card expense-card" data-id="${d.id}">
          <div class="sale-card-top">
            <span class="sale-card-date">${escapeHtml(d.drawingNumber)} · ${dateLabel}</span>
            <span class="sale-card-total">${formatNaira(d.amount)}</span>
          </div>
          <div class="sale-card-items">${escapeHtml(d.reason)}${d.description ? " — " + escapeHtml(d.description) : ""}</div>
          <span class="sale-card-badge">${escapeHtml(d.paymentMethod)}</span>
          ${detailHtml}
        </div>
      `;
    })
    .join("");
}

function handleDeleteDrawing(id) {
  const confirmed = confirm("Delete this drawing? This will reverse its effect on your Cash/Bank balance.");
  if (!confirmed) return;

  deleteDrawing(id);
  if (expandedDrawingId === id) expandedDrawingId = null;

  renderDrawingsTodaySummary();
  renderDrawingsStatGrid();
  renderDrawingList();
  renderDashboard();
}

drawingList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".edit-drawing-btn");
  if (editButton) {
    openEditDrawingForm(editButton.dataset.id);
    return;
  }

  const deleteButton = event.target.closest(".drawing-delete-btn");
  if (deleteButton) {
    handleDeleteDrawing(deleteButton.dataset.id);
    return;
  }

  const card = event.target.closest(".expense-card");
  if (!card) return;
  expandedDrawingId = expandedDrawingId === card.dataset.id ? null : card.dataset.id;
  renderDrawingList();
});

// ---- 8m4. Money Transfers: form, save, history (Module 22) --------------------
// Internal Cash <-> Bank movements. Never touches Sales, Purchases, Expenses,
// Drawings, Profit, Receivables, Payables, or Inventory — it only moves money
// already sitting in business.cash / business.bank between the two of them.

function resetTransferForm() {
  transferDate.value = todayDateValue();
  transferDirection.value = "";
  transferAmount.value = "";
  transferNote.value = "";
  transferFormError.textContent = "";
}

function openNewTransferForm() {
  resetTransferForm();
  transferFormCard.hidden = false;
  transferDirection.focus();
}

if (newTransferBtn) newTransferBtn.addEventListener("click", openNewTransferForm);

if (cancelTransferBtn) {
  cancelTransferBtn.addEventListener("click", () => {
    transferFormCard.hidden = true;
    resetTransferForm();
  });
}

if (saveTransferBtn) {
  saveTransferBtn.addEventListener("click", () => {
    const dateVal = transferDate.value;
    const direction = transferDirection.value;
    const amount = Number(transferAmount.value);
    const note = transferNote.value.trim();

    if (!dateVal) {
      transferFormError.textContent = "Select a valid date.";
      transferDate.focus();
      return;
    }
    if (!direction) {
      transferFormError.textContent = "Select a transfer direction.";
      transferDirection.focus();
      return;
    }
    if (transferAmount.value === "" || isNaN(amount) || amount <= 0) {
      transferFormError.textContent = "Enter an amount greater than ₦0.";
      transferAmount.focus();
      return;
    }

    const [fromAccount, toAccount] = direction === "cashToBank" ? ["Cash", "Bank"] : ["Bank", "Cash"];
    const result = createMoneyTransfer({ fromAccount, toAccount, amount, note, date: dateVal });

    if (!result.ok) {
      transferFormError.textContent = result.error;
      return;
    }

    transferFormCard.hidden = true;
    resetTransferForm();
    renderTransfersStatGrid();
    renderTransferList();
    renderDashboard();
  });
}

function renderTransfersStatGrid() {
  if (!transfersStatTotal) return;
  transfersStatTotal.textContent = formatNaira(computeTotalTransfers());
  transfersStatCashToBank.textContent = formatNaira(computeCashToBankTransfers());
  transfersStatBankToCash.textContent = formatNaira(computeBankToCashTransfers());
}

function sortTransfersForDisplay(transfers) {
  return transfers.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderTransferList() {
  if (!transferList) return;
  const transfers = sortTransfersForDisplay(loadMoneyTransfers());

  if (transfers.length === 0) {
    transferList.innerHTML = '<div class="sales-empty">No transfers recorded yet. Tap "+ New Transfer" to move money between Cash and Bank.</div>';
    return;
  }

  transferList.innerHTML = transfers
    .map((t) => {
      const badges = [`<span class="sale-card-badge">${escapeHtml(t.fromAccount)} → ${escapeHtml(t.toAccount)}</span>`];
      if (t.reversed) badges.push('<span class="sale-card-badge purchase-payment-credit">Reversed</span>');
      return `
        <div class="sale-card" data-id="${t.id}">
          <div class="sale-card-top">
            <span class="sale-card-date">${escapeHtml(t.transferNumber)} · ${formatExpenseDate(t.date)}</span>
            <span class="sale-card-total">${formatNaira(t.amount)}</span>
          </div>
          <div class="sale-card-items">${t.note ? escapeHtml(t.note) : "Internal transfer"}</div>
          <div class="product-card-actions">${badges.join(" ")}</div>
          ${!t.reversed ? `<div class="product-card-actions"><button type="button" class="btn-link btn-link-danger reverse-transfer-btn" data-id="${t.id}">Reverse this transfer</button></div>` : ""}
        </div>
      `;
    })
    .join("");
}

if (transferList) {
  transferList.addEventListener("click", (event) => {
    const btn = event.target.closest(".reverse-transfer-btn");
    if (!btn) return;
    const confirmed = confirm("Reverse this transfer? This will move the money back to its original account.");
    if (!confirmed) return;

    const result = reverseMoneyTransfer(btn.dataset.id);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    renderTransfersStatGrid();
    renderTransferList();
    renderDashboard();
  });
}

// ---- 8n. Customers: add customer form ----------------------------------------

function resetCustomerForm() {
  customerName.value = "";
  customerPhone.value = "";
  customerEmail.value = "";
  customerAddress.value = "";
  customerNotes.value = "";
  customerFormError.textContent = "";
}

function openNewCustomerForm() {
  resetCustomerForm();
  customerFormCard.hidden = false;
  customerName.focus();
}

newCustomerBtn.addEventListener("click", openNewCustomerForm);

cancelCustomerBtn.addEventListener("click", () => {
  customerFormCard.hidden = true;
  resetCustomerForm();
});

saveCustomerBtn.addEventListener("click", () => {
  const name = customerName.value.trim();
  const phone = customerPhone.value.trim();
  const email = customerEmail.value.trim();

  if (!name) {
    customerFormError.textContent = "Enter a customer name.";
    customerName.focus();
    return;
  }
  if (email && !isValidEmail(email)) {
    customerFormError.textContent = "Enter a valid email, or leave it blank.";
    customerEmail.focus();
    return;
  }

  addCustomer({
    id: Date.now().toString(),
    name,
    phone,
    email,
    address: customerAddress.value.trim(),
    notes: customerNotes.value.trim(),
    createdAt: new Date().toISOString()
  });

  customerFormCard.hidden = true;
  resetCustomerForm();
  renderCustomersSummary();
  renderCustomerList();
});

// ---- 8o. Customers: list view -------------------------------------------------

function renderCustomersSummary() {
  const customers = loadCustomers();
  customersSummary.textContent = `${customers.length} customer${customers.length === 1 ? "" : "s"}`;
}

function renderCustomerList() {
  const customers = loadCustomers().slice().reverse(); // newest first

  if (customers.length === 0) {
    customerList.innerHTML = '<div class="sales-empty">No customers yet. Tap "+ Add Customer" to add your first one.</div>';
    return;
  }

  customerList.innerHTML = customers
    .map((c) => {
      const stats = getCustomerStats(c.id);
      const statusHtml = stats.balance > 0
        ? `<span class="sale-card-badge purchase-payment-credit">Owes ${formatNaira(stats.balance)}</span>`
        : `<span class="sale-card-badge">Paid · ₦0 owed</span>`;
      return `
        <div class="sale-card supplier-card" data-id="${c.id}">
          <div class="sale-card-top">
            <span class="supplier-card-name">${escapeHtml(c.name)}</span>
          </div>
          <div class="supplier-card-phone">${escapeHtml(c.phone || "No phone number")}</div>
          ${statusHtml}
        </div>
      `;
    })
    .join("");
}

customerList.addEventListener("click", (event) => {
  const card = event.target.closest(".supplier-card");
  if (!card) return;
  showCustomerDetailView(card.dataset.id);
});

function showCustomersListView() {
  customersListView.hidden = false;
  customerDetailView.hidden = true;
  renderCustomersSummary();
  renderCustomerList();
}

backToCustomersBtn.addEventListener("click", showCustomersListView);

// ---- 8p. Customers: detail view, statement, and record payment ---------------

let currentCustomerId = null;

function showCustomerDetailView(customerId) {
  const customer = loadCustomers().find((c) => c.id === customerId);
  if (!customer) {
    showCustomersListView();
    return;
  }

  currentCustomerId = customerId;
  customersListView.hidden = true;
  customerDetailView.hidden = false;
  customerPaymentFormCard.hidden = true;

  customerDetailName.textContent = customer.name;
  customerDetailContact.textContent = [customer.phone, customer.email].filter(Boolean).join(" · ") || "No contact details";
  paymentCustomerName.textContent = customer.name;

  renderCustomerStatement(customerId);
}

function renderCustomerStatement(customerId) {
  const stats = getCustomerStats(customerId);
  customerStatTotal.textContent = formatNaira(stats.totalCharges);
  customerStatPaid.textContent = formatNaira(stats.totalPayments);
  customerStatOwed.textContent = formatNaira(stats.balance);

  // Merge Credit sales (charges) and Payments (credits) into one
  // chronological ledger with a running balance, like a real statement.
  const entries = stats.creditSales
    .map((s) => ({ date: s.createdAt, label: "Credit Sale", debit: Number(s.total) || 0, credit: 0 }))
    .concat(
      stats.payments.map((p) => ({
        date: p.createdAt,
        label: "Payment — " + p.paymentMethod,
        debit: 0,
        credit: Number(p.amount) || 0
      }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (entries.length === 0) {
    customerStatement.innerHTML = '<div class="sales-empty">No transactions yet for this customer.</div>';
    return;
  }

  let runningBalance = 0;
  customerStatement.innerHTML = entries
    .map((entry) => {
      runningBalance += entry.debit - entry.credit;
      const dateLabel = new Date(entry.date).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      return `
        <div class="statement-row">
          <span class="statement-row-desc">${escapeHtml(entry.label)}</span>
          <span class="statement-row-balance">${formatNaira(runningBalance)}</span>
          <span class="statement-row-date">${dateLabel}</span>
          <div class="statement-row-amounts">
            <span>Debit: ${entry.debit ? formatNaira(entry.debit) : "—"}</span>
            <span>Credit: ${entry.credit ? formatNaira(entry.credit) : "—"}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function resetCustomerPaymentForm() {
  customerPaymentDate.value = todayDateValue();
  customerPaymentAmount.value = "";
  customerPaymentMethod.value = "";
  customerPaymentNote.value = "";
  customerPaymentFormError.textContent = "";
}

newCustomerPaymentBtn.addEventListener("click", () => {
  resetCustomerPaymentForm();
  customerPaymentFormCard.hidden = false;
  customerPaymentAmount.focus();
});

cancelCustomerPaymentBtn.addEventListener("click", () => {
  customerPaymentFormCard.hidden = true;
  resetCustomerPaymentForm();
});

saveCustomerPaymentBtn.addEventListener("click", () => {
  const dateVal = customerPaymentDate.value;
  const amount = Number(customerPaymentAmount.value);
  const method = customerPaymentMethod.value;
  const note = customerPaymentNote.value.trim();

  if (!dateVal) {
    customerPaymentFormError.textContent = "Select a valid date.";
    customerPaymentDate.focus();
    return;
  }
  if (customerPaymentAmount.value === "" || isNaN(amount) || amount <= 0) {
    customerPaymentFormError.textContent = "Enter an amount greater than ₦0.";
    customerPaymentAmount.focus();
    return;
  }
  if (!method) {
    customerPaymentFormError.textContent = "Select a payment method.";
    customerPaymentMethod.focus();
    return;
  }

  const stats = getCustomerStats(currentCustomerId);
  if (stats.balance <= 0) {
    customerPaymentFormError.textContent = "This customer has no outstanding balance.";
    return;
  }
  if (amount > stats.balance) {
    customerPaymentFormError.textContent = "Payment cannot exceed the customer's outstanding balance.";
    customerPaymentAmount.focus();
    return;
  }

  addCustomerPayment({
    id: Date.now().toString(),
    customerId: currentCustomerId,
    date: dateVal,
    amount,
    paymentMethod: method,
    note,
    createdAt: new Date().toISOString()
  });

  customerPaymentFormCard.hidden = true;
  resetCustomerPaymentForm();
  renderCustomerStatement(currentCustomerId);
  renderDashboard();
});

// ---- 8p. Reports: date range engine ---------------------------------------------

let reportsDateRangeType = "thisMonth";
let reportsCustomFrom = null;
let reportsCustomTo = null;

// Dashboard V2 has its own period selector, independent of the Reports
// section's — they can be set differently without affecting each other.
let dashboardDateRangeType = "today";

const DASHBOARD_RANGE_LABELS = {
  today: "Today",
  thisWeek: "This Week",
  thisMonth: "This Month",
  thisYear: "This Year"
};

// Sales/Purchases/Payments carry a full createdAt timestamp; Expenses and
// Drawings carry a plain "YYYY-MM-DD" date the owner picked. Both are
// normalized to a local midnight Date so range comparisons never drift
// because of time-of-day or timezone/UTC conversion.
function recordDateOnly(record) {
  const raw = record.date ? record.date + "T00:00:00" : record.createdAt;
  const dt = new Date(raw);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

// Generic version of the range logic — takes explicit arguments so both
// Reports and Dashboard V2 can compute bounds from their own independent
// period selection without duplicating this switch statement anywhere.
function getRangeBounds(rangeType, customFrom, customTo) {
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (rangeType) {
    case "today":
      return { start: todayMid, end: todayMid };
    case "yesterday": {
      const y = new Date(todayMid);
      y.setDate(y.getDate() - 1);
      return { start: y, end: y };
    }
    case "thisWeek": {
      const start = new Date(todayMid);
      start.setDate(start.getDate() - start.getDay());
      return { start, end: todayMid };
    }
    case "lastWeek": {
      const thisWeekStart = new Date(todayMid);
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      const start = new Date(thisWeekStart);
      start.setDate(start.getDate() - 7);
      const end = new Date(thisWeekStart);
      end.setDate(end.getDate() - 1);
      return { start, end };
    }
    case "thisMonth":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    case "lastMonth":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0)
      };
    case "thisYear":
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
    case "lastYear":
      return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, 11, 31) };
    case "custom": {
      if (!customFrom || !customTo) return null;
      return {
        start: new Date(customFrom + "T00:00:00"),
        end: new Date(customTo + "T00:00:00")
      };
    }
    case "allTime":
    default:
      return null; // no bounds — include everything
  }
}

function getReportRangeBounds() {
  return getRangeBounds(reportsDateRangeType, reportsCustomFrom, reportsCustomTo);
}

function isRecordInRange(record, bounds) {
  if (!bounds) return true;
  const d = recordDateOnly(record);
  return d >= bounds.start && d <= bounds.end;
}

function getFilteredSales(bounds) {
  return loadSales().filter((s) => isRecordInRange(s, bounds));
}

function getFilteredPurchases(bounds) {
  return loadPurchases().filter((p) => isRecordInRange(p, bounds));
}

function getFilteredExpenses(bounds) {
  return loadExpenses().filter((e) => isRecordInRange(e, bounds));
}

function getFilteredDrawings(bounds) {
  return loadDrawings().filter((d) => isRecordInRange(d, bounds));
}

function getFilteredInventoryAdjustments(bounds) {
  return loadInventoryAdjustments().filter((a) => isRecordInRange(a, bounds));
}

function getFilteredMoneyTransfers(bounds) {
  return loadMoneyTransfers().filter((t) => isRecordInRange(t, bounds));
}

const REPORT_RANGE_LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  thisYear: "This Year",
  allTime: "All Time"
};

function formatReportDate(d) {
  const fmt = loadSettings().dateFormat;
  if (fmt === "dd/mm/yyyy") return d.toLocaleDateString("en-GB");
  if (fmt === "mm/dd/yyyy") return d.toLocaleDateString("en-US");
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function computeRangeLabelText(bounds) {
  if (reportsDateRangeType === "custom") {
    return bounds ? `${formatReportDate(bounds.start)} – ${formatReportDate(bounds.end)}` : "Select a custom range";
  }
  return REPORT_RANGE_LABELS[reportsDateRangeType] || "All Time";
}

// ---- 8p2. Reports: calculations (all read-only, reuse existing helpers) --------

function computeSalesReport(sales) {
  const totalSales = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const numberOfSales = sales.length;
  const totalItemsSold = sales.reduce(
    (sum, s) => sum + (s.items || []).reduce((a, it) => a + (Number(it.qty) || 0), 0),
    0
  );

  const byMethod = { Cash: 0, "Bank Transfer": 0, POS: 0, Other: 0 };
  let credit = 0;
  sales.forEach((s) => {
    if (s.paymentType === "Credit") {
      credit += Number(s.total) || 0;
      return;
    }
    if (byMethod[s.paymentMethod] !== undefined) {
      byMethod[s.paymentMethod] += Number(s.total) || 0;
    }
  });

  return {
    totalSales,
    numberOfSales,
    totalItemsSold,
    cash: byMethod.Cash,
    bank: byMethod["Bank Transfer"],
    pos: byMethod.POS,
    other: byMethod.Other,
    credit
  };
}

function computePurchasesReport(purchases) {
  const totalPurchases = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const numberOfPurchases = purchases.length;
  const cash = purchases.filter((p) => p.paymentMethod === "Cash").reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const bank = purchases.filter((p) => p.paymentMethod === "Bank").reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const credit = purchases.filter((p) => p.paymentMethod === "Credit").reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  return { totalPurchases, numberOfPurchases, cash, bank, credit };
}

function computeExpensesReport(expenses) {
  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const cash = expenses.filter((e) => e.paymentMethod === "Cash").reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const bank = expenses.filter((e) => e.paymentMethod === "Bank").reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const byCategory = {};
  expenses.forEach((e) => {
    const cat = e.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + (Number(e.amount) || 0);
  });
  return { total, cash, bank, byCategory };
}

function computeDrawingsReport(drawings) {
  const total = drawings.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const cash = drawings.filter((d) => d.paymentMethod === "Cash").reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const bank = drawings.filter((d) => d.paymentMethod === "Bank").reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const byReason = {};
  drawings.forEach((d) => {
    const reason = d.reason || "Other";
    byReason[reason] = (byReason[reason] || 0) + (Number(d.amount) || 0);
  });
  return { total, cash, bank, byReason };
}

// Inventory Adjustments report: manual stock corrections only. Clearly
// distinct from Purchases (stock bought in) and Sales (stock sold out) — it
// never counts toward either, so it never inflates a purchase total.
function computeInventoryAdjustmentsReport(adjustments) {
  const nonReversal = adjustments.filter((a) => a.type !== "reversal");
  const additions = nonReversal.filter((a) => a.type === "addition");
  const removals = nonReversal.filter((a) => a.type === "removal");
  const reversals = adjustments.filter((a) => a.type === "reversal");
  const unitsAdded = additions.reduce((sum, a) => sum + a.qtyChange, 0);
  const unitsRemoved = removals.reduce((sum, a) => sum + Math.abs(a.qtyChange), 0);
  return {
    count: nonReversal.length,
    additionsCount: additions.length,
    removalsCount: removals.length,
    reversalsCount: reversals.length,
    unitsAdded,
    unitsRemoved
  };
}

// Money Transfers report: internal Cash <-> Bank movements only. Shown as
// internal movements — never added to Sales, Revenue, Expenses, or Profit.
function computeMoneyTransfersReport(transfers) {
  const total = transfers.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const cashToBank = transfers.filter((t) => t.fromAccount === "Cash").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const bankToCash = transfers.filter((t) => t.fromAccount === "Bank").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  return { count: transfers.length, total, cashToBank, bankToCash };
}

// Receivables/Payables intentionally ignore the date filter — an outstanding
// balance is a current snapshot, not something that happened "within a
// period", and getCustomerStats/getSupplierStats are the same functions the
// Customers/Suppliers sections already use, so this can never disagree with them.
function computeReceivablesReport() {
  const rows = loadCustomers()
    .map((c) => ({ id: c.id, name: c.name, balance: getCustomerStats(c.id).balance }))
    .filter((r) => r.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const total = rows.reduce((sum, r) => sum + r.balance, 0);
  return { count: rows.length, total, rows };
}

function computePayablesReport() {
  const rows = loadSuppliers()
    .map((s) => ({ id: s.id, name: s.name, owed: getSupplierStats(s.id).owed }))
    .filter((r) => r.owed > 0)
    .sort((a, b) => b.owed - a.owed);
  const total = rows.reduce((sum, r) => sum + r.owed, 0);
  return { count: rows.length, total, rows };
}

// Inventory is a current snapshot too, not a period-based flow, so it also
// ignores the date filter and reuses the same computeInventoryValue() the
// Dashboard and Inventory section already rely on.
function computeInventoryReportData() {
  const products = loadInventory();
  const totalUnits = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const threshold = getLowStockThreshold();
  const lowStock = products
    .filter((p) => (Number(p.quantity) || 0) <= threshold)
    .sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0));
  return {
    totalProducts: products.length,
    totalUnits,
    stockValue: computeInventoryValue(),
    lowStock
  };
}

function computeTopProductsReport(sales, limit) {
  const map = {};
  sales.forEach((s) => {
    (s.items || []).forEach((item) => {
      const key = item.productId || "custom:" + item.name;
      if (!map[key]) map[key] = { name: item.name, qty: 0, value: 0 };
      map[key].qty += Number(item.qty) || 0;
      map[key].value += (Number(item.qty) || 0) * (Number(item.price) || 0);
    });
  });
  return Object.values(map)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit || 10);
}

function computeSalesTrend(sales) {
  const map = {};
  sales.forEach((s) => {
    const key = toDateInputValue(recordDateOnly(s));
    map[key] = (map[key] || 0) + (Number(s.total) || 0);
  });
  return Object.keys(map)
    .sort()
    .map((key) => ({ date: key, total: map[key] }));
}

// ---- 8p3. Reports: rendering ----------------------------------------------------

function renderStatGrid(container, items) {
  container.innerHTML = items
    .map(
      ([label, value]) => `
        <div class="stat-card">
          <span class="stat-label">${escapeHtml(label)}</span>
          <span class="stat-value">${value}</span>
        </div>
      `
    )
    .join("");
}

function renderBreakdownRows(container, entries, emptyText) {
  if (entries.length === 0) {
    container.innerHTML = `<div class="sales-empty">${escapeHtml(emptyText)}</div>`;
    return;
  }
  container.innerHTML =
    '<div class="report-row-list">' +
    entries
      .map(
        ([label, value]) => `
          <div class="report-row">
            <span class="report-row-label">${escapeHtml(label)}</span>
            <span class="report-row-value">${value}</span>
          </div>
        `
      )
      .join("") +
    "</div>";
}

function renderTopProductsList(container, items) {
  if (items.length === 0) {
    container.innerHTML = '<div class="sales-empty">No sales for this period.</div>';
    return;
  }
  container.innerHTML =
    '<div class="report-row-list">' +
    items
      .map(
        (it) => `
          <div class="report-row">
            <div>
              <div class="report-row-label">${escapeHtml(it.name)}</div>
              <div class="report-row-sub">${it.qty} units</div>
            </div>
            <span class="report-row-value">${formatNaira(it.value)}</span>
          </div>
        `
      )
      .join("") +
    "</div>";
}

function renderSalesTrendChart(container, trend) {
  if (trend.length === 0) {
    container.innerHTML = '<div class="sales-empty">No sales for this period.</div>';
    return;
  }
  const max = Math.max(...trend.map((t) => t.total), 1);
  container.innerHTML = trend
    .map((t) => {
      const pct = Math.max(2, Math.round((t.total / max) * 100));
      const dateLabel = new Date(t.date + "T00:00:00").toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short"
      });
      return `
        <div class="trend-row">
          <span class="trend-date">${dateLabel}</span>
          <div class="trend-bar-track"><div class="trend-bar-fill" style="width:${pct}%"></div></div>
          <span class="trend-value">${formatNaira(t.total)}</span>
        </div>
      `;
    })
    .join("");
}

function renderPaymentMethodTables(container, salesReport, purchasesReport, expensesReport, drawingsReport) {
  container.innerHTML = `
    <h3 class="report-subtitle">Sales</h3>
    <div class="report-row-list">
      <div class="report-row"><span class="report-row-label">Cash</span><span class="report-row-value">${formatNaira(salesReport.cash)}</span></div>
      <div class="report-row"><span class="report-row-label">Bank</span><span class="report-row-value">${formatNaira(salesReport.bank)}</span></div>
      <div class="report-row"><span class="report-row-label">POS</span><span class="report-row-value">${formatNaira(salesReport.pos)}</span></div>
      <div class="report-row"><span class="report-row-label">Credit</span><span class="report-row-value">${formatNaira(salesReport.credit)}</span></div>
    </div>
    <h3 class="report-subtitle">Purchases</h3>
    <div class="report-row-list">
      <div class="report-row"><span class="report-row-label">Cash</span><span class="report-row-value">${formatNaira(purchasesReport.cash)}</span></div>
      <div class="report-row"><span class="report-row-label">Bank</span><span class="report-row-value">${formatNaira(purchasesReport.bank)}</span></div>
      <div class="report-row"><span class="report-row-label">Credit</span><span class="report-row-value">${formatNaira(purchasesReport.credit)}</span></div>
    </div>
    <h3 class="report-subtitle">Expenses</h3>
    <div class="report-row-list">
      <div class="report-row"><span class="report-row-label">Cash</span><span class="report-row-value">${formatNaira(expensesReport.cash)}</span></div>
      <div class="report-row"><span class="report-row-label">Bank</span><span class="report-row-value">${formatNaira(expensesReport.bank)}</span></div>
    </div>
    <h3 class="report-subtitle">Drawings</h3>
    <div class="report-row-list">
      <div class="report-row"><span class="report-row-label">Cash</span><span class="report-row-value">${formatNaira(drawingsReport.cash)}</span></div>
      <div class="report-row"><span class="report-row-label">Bank</span><span class="report-row-value">${formatNaira(drawingsReport.bank)}</span></div>
    </div>
  `;
}

// The single entry point that recalculates and repaints every report section
// for the currently selected date range. Purely reads existing data — never
// writes anything back to storage.
function renderReports() {
  const bounds = getReportRangeBounds();
  const rangeLabelText = computeRangeLabelText(bounds);
  reportsRangeLabel.textContent = rangeLabelText;
  reportPrintRangeLabel.textContent = rangeLabelText;

  const business = loadBusiness();
  reportPrintBusinessName.textContent = (business && business.businessName) || "Business Reports";

  const sales = getFilteredSales(bounds);
  const purchases = getFilteredPurchases(bounds);
  const expenses = getFilteredExpenses(bounds);
  const drawings = getFilteredDrawings(bounds);
  const stockAdjustments = getFilteredInventoryAdjustments(bounds);
  const moneyTransfers = getFilteredMoneyTransfers(bounds);

  const salesReport = computeSalesReport(sales);
  const purchasesReport = computePurchasesReport(purchases);
  const grossProfit = sales.reduce((sum, s) => sum + computeSaleProfit(s), 0);
  const cogs = salesReport.totalSales - grossProfit;
  const expensesReport = computeExpensesReport(expenses);
  const netProfit = grossProfit - expensesReport.total;
  const drawingsReport = computeDrawingsReport(drawings);
  const receivablesReport = computeReceivablesReport();
  const payablesReport = computePayablesReport();
  const inventoryReport = computeInventoryReportData();
  const adjustmentsReport = computeInventoryAdjustmentsReport(stockAdjustments);
  const transfersReport = computeMoneyTransfersReport(moneyTransfers);
  const topProducts = computeTopProductsReport(sales, 10);
  const trend = computeSalesTrend(sales);

  // Financial summary
  renderStatGrid(reportFinancialSummaryGrid, [
    ["Revenue", formatNaira(salesReport.totalSales)],
    ["Cost of Goods Sold", formatNaira(cogs)],
    ["Gross Profit", formatNaira(grossProfit)],
    ["Expenses", formatNaira(expensesReport.total)],
    ["Net Profit", formatNaira(netProfit)],
    ["Customer Receivables", formatNaira(receivablesReport.total)],
    ["Supplier Payables", formatNaira(payablesReport.total)],
    ["Owner Drawings", formatNaira(drawingsReport.total)]
  ]);

  // Sales
  if (sales.length === 0) {
    reportSalesGrid.innerHTML = '<div class="sales-empty">No sales for this period.</div>';
  } else {
    const salesItems = [
      ["Total Sales", formatNaira(salesReport.totalSales)],
      ["Number of Sales", String(salesReport.numberOfSales)],
      ["Items Sold", String(salesReport.totalItemsSold)],
      ["Cash", formatNaira(salesReport.cash)],
      ["Bank", formatNaira(salesReport.bank)],
      ["POS", formatNaira(salesReport.pos)],
      ["Credit", formatNaira(salesReport.credit)]
    ];
    if (salesReport.other) salesItems.push(["Other", formatNaira(salesReport.other)]);
    renderStatGrid(reportSalesGrid, salesItems);
  }

  // Purchases
  if (purchases.length === 0) {
    reportPurchasesGrid.innerHTML = '<div class="sales-empty">No purchases for this period.</div>';
  } else {
    renderStatGrid(reportPurchasesGrid, [
      ["Total Purchases", formatNaira(purchasesReport.totalPurchases)],
      ["Number of Purchases", String(purchasesReport.numberOfPurchases)],
      ["Cash", formatNaira(purchasesReport.cash)],
      ["Bank", formatNaira(purchasesReport.bank)],
      ["Credit", formatNaira(purchasesReport.credit)]
    ]);
  }

  // Profit (gross + net together)
  renderStatGrid(reportProfitGrid, [
    ["Sales Revenue", formatNaira(salesReport.totalSales)],
    ["Cost of Goods Sold", formatNaira(cogs)],
    ["Gross Profit", formatNaira(grossProfit)],
    ["Expenses", formatNaira(expensesReport.total)],
    ["Net Profit", formatNaira(netProfit)]
  ]);

  // Expenses
  if (expenses.length === 0) {
    reportExpensesSummaryGrid.innerHTML = '<div class="sales-empty">No expenses for this period.</div>';
    reportExpensesByCategory.innerHTML = "";
  } else {
    renderStatGrid(reportExpensesSummaryGrid, [
      ["Total Expenses", formatNaira(expensesReport.total)],
      ["Cash Expenses", formatNaira(expensesReport.cash)],
      ["Bank Expenses", formatNaira(expensesReport.bank)]
    ]);
    const categoryEntries = Object.entries(expensesReport.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([label, amount]) => [label, formatNaira(amount)]);
    renderBreakdownRows(reportExpensesByCategory, categoryEntries, "No expenses for this period.");
  }

  // Customer receivables (current, not period-filtered)
  renderStatGrid(reportReceivablesGrid, [
    ["Customers Owing", String(receivablesReport.count)],
    ["Total Receivables", formatNaira(receivablesReport.total)]
  ]);
  renderBreakdownRows(
    reportReceivablesList,
    receivablesReport.rows.map((r) => [r.name, formatNaira(r.balance)]),
    "No customers currently owe the business."
  );

  // Supplier payables (current, not period-filtered)
  renderStatGrid(reportPayablesGrid, [
    ["Suppliers Owed", String(payablesReport.count)],
    ["Total Payables", formatNaira(payablesReport.total)]
  ]);
  renderBreakdownRows(
    reportPayablesList,
    payablesReport.rows.map((r) => [r.name, formatNaira(r.owed)]),
    "No outstanding supplier balances."
  );

  // Drawings
  if (drawings.length === 0) {
    reportDrawingsGrid.innerHTML = '<div class="sales-empty">No drawings for this period.</div>';
    reportDrawingsByReason.innerHTML = "";
  } else {
    renderStatGrid(reportDrawingsGrid, [
      ["Total Drawings", formatNaira(drawingsReport.total)],
      ["Cash Drawings", formatNaira(drawingsReport.cash)],
      ["Bank Drawings", formatNaira(drawingsReport.bank)]
    ]);
    const reasonEntries = Object.entries(drawingsReport.byReason)
      .sort((a, b) => b[1] - a[1])
      .map(([label, amount]) => [label, formatNaira(amount)]);
    renderBreakdownRows(reportDrawingsByReason, reasonEntries, "No drawings for this period.");
  }

  // Inventory (current snapshot, not period-filtered)
  renderStatGrid(reportInventoryGrid, [
    ["Total Products", String(inventoryReport.totalProducts)],
    ["Units in Stock", String(inventoryReport.totalUnits)],
    ["Stock Value", formatNaira(inventoryReport.stockValue)]
  ]);
  reportLowStockThresholdLabel.textContent = `(${getLowStockThreshold()} or fewer units)`;
  renderBreakdownRows(
    reportLowStockList,
    inventoryReport.lowStock.map((p) => [p.name, `${p.quantity} units`]),
    `No products at or below ${getLowStockThreshold()} units.`
  );

  // Inventory Adjustments (manual stock corrections — never purchases)
  if (reportAdjustmentsGrid) {
    if (stockAdjustments.length === 0) {
      reportAdjustmentsGrid.innerHTML = '<div class="sales-empty">No stock adjustments for this period.</div>';
    } else {
      renderStatGrid(reportAdjustmentsGrid, [
        ["Adjustments", String(adjustmentsReport.count)],
        ["Units Added", String(adjustmentsReport.unitsAdded)],
        ["Units Removed", String(adjustmentsReport.unitsRemoved)],
        ["Reversals", String(adjustmentsReport.reversalsCount)]
      ]);
    }
  }

  // Money Transfers (internal Cash <-> Bank movement — never revenue/expense)
  if (reportTransfersGrid) {
    if (moneyTransfers.length === 0) {
      reportTransfersGrid.innerHTML = '<div class="sales-empty">No money transfers for this period.</div>';
    } else {
      renderStatGrid(reportTransfersGrid, [
        ["Transfers", String(transfersReport.count)],
        ["Total Moved", formatNaira(transfersReport.total)],
        ["Cash → Bank", formatNaira(transfersReport.cashToBank)],
        ["Bank → Cash", formatNaira(transfersReport.bankToCash)]
      ]);
    }
  }

  // Payment methods
  renderPaymentMethodTables(reportPaymentMethodsTables, salesReport, purchasesReport, expensesReport, drawingsReport);

  // Top selling products
  renderTopProductsList(reportTopProducts, topProducts);

  // Sales trend
  renderSalesTrendChart(reportSalesTrend, trend);
}

reportRangePills.addEventListener("click", (event) => {
  const btn = event.target.closest(".report-pill");
  if (!btn) return;

  reportsDateRangeType = btn.dataset.range;
  reportRangePills.querySelectorAll(".report-pill").forEach((p) => {
    p.classList.toggle("is-active", p === btn);
  });

  reportCustomRange.hidden = reportsDateRangeType !== "custom";

  if (reportsDateRangeType === "custom") {
    if (!reportFromDate.value) reportFromDate.value = todayDateValue();
    if (!reportToDate.value) reportToDate.value = todayDateValue();
    if (!reportsCustomFrom || !reportsCustomTo) return; // wait for Apply
    reportsCustomFrom = reportFromDate.value;
    reportsCustomTo = reportToDate.value;
  }

  renderReports();
});

applyCustomRangeBtn.addEventListener("click", () => {
  if (!reportFromDate.value || !reportToDate.value) {
    alert("Select both a From and To date.");
    return;
  }
  if (reportFromDate.value > reportToDate.value) {
    alert('The "From" date must be before the "To" date.');
    return;
  }
  reportsCustomFrom = reportFromDate.value;
  reportsCustomTo = reportToDate.value;
  renderReports();
});

printReportBtn.addEventListener("click", () => {
  window.print();
});



// ---- 8q. Backup & Restore --------------------------------------------------------

const BACKUP_APP_NAME = "NBA";
const BACKUP_VERSION = 1;
const LAST_BACKUP_KEY = "nexaLastBackupAt"; // metadata only — not business data, excluded from backups

// The single authoritative map of every localStorage key NBA actually
// writes to. This mirrors the _KEY constants declared at the top of this
// file exactly, so backup/restore can never drift out of sync with what
// the app really stores — nothing here is guessed.
const NBA_BACKUP_KEYS = {
  business: STORAGE_KEY,
  sales: SALES_KEY,
  inventory: INVENTORY_KEY,
  suppliers: SUPPLIERS_KEY,
  purchases: PURCHASES_KEY,
  supplierPayments: SUPPLIER_PAYMENTS_KEY,
  expenses: EXPENSES_KEY,
  expenseCounter: EXPENSE_COUNTER_KEY,
  drawings: DRAWINGS_KEY,
  drawingCounter: DRAWING_COUNTER_KEY,
  customers: CUSTOMERS_KEY,
  customerPayments: CUSTOMER_PAYMENTS_KEY,
  receiptNumbers: RECEIPT_NUMBERS_KEY,
  receiptCounter: RECEIPT_COUNTER_KEY,
  settings: SETTINGS_KEY,
  inventoryAdjustments: INVENTORY_ADJUSTMENTS_KEY,
  adjustmentCounter: ADJUSTMENT_COUNTER_KEY,
  moneyTransfers: MONEY_TRANSFERS_KEY,
  transferCounter: TRANSFER_COUNTER_KEY
};

// Fields that must be arrays if present, used to sanity-check a restored file.
const BACKUP_ARRAY_FIELDS = [
  "sales", "inventory", "suppliers", "purchases", "supplierPayments",
  "expenses", "drawings", "customers", "customerPayments",
  "inventoryAdjustments", "moneyTransfers"
];

function collectBackupData() {
  const data = {};
  Object.entries(NBA_BACKUP_KEYS).forEach(([field, key]) => {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      data[field] = null;
      return;
    }
    try {
      // Counters are stored as plain numeric strings (e.g. "3"), which are
      // themselves valid JSON, so JSON.parse handles every stored shape here.
      data[field] = JSON.parse(raw);
    } catch (e) {
      data[field] = raw;
    }
  });
  return data;
}

function buildBackupObject() {
  const business = loadBusiness();
  return {
    app: BACKUP_APP_NAME,
    backupVersion: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    businessName: (business && business.businessName) || "",
    data: collectBackupData()
  };
}

function sanitizeFilenamePart(str) {
  return String(str || "")
    .trim()
    .replace(/[^a-zA-Z0-9\- ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

function buildBackupFilename(businessName, dateObj) {
  const datePart = toDateInputValue(dateObj);
  const namePart = sanitizeFilenamePart(businessName);
  return namePart ? `NBA-Backup-${namePart}-${datePart}.json` : `NBA-Backup-${datePart}.json`;
}

function computeBackupCounts() {
  return {
    products: loadInventory().length,
    sales: loadSales().length,
    purchases: loadPurchases().length,
    customers: loadCustomers().length,
    suppliers: loadSuppliers().length,
    expenses: loadExpenses().length,
    drawings: loadDrawings().length,
    stockAdjustments: loadInventoryAdjustments().length,
    transfers: loadMoneyTransfers().length
  };
}

function renderBackupSummary() {
  const counts = computeBackupCounts();
  renderStatGrid(backupSummaryGrid, [
    ["Products", String(counts.products)],
    ["Sales", String(counts.sales)],
    ["Purchases", String(counts.purchases)],
    ["Customers", String(counts.customers)],
    ["Suppliers", String(counts.suppliers)],
    ["Expenses", String(counts.expenses)],
    ["Drawings", String(counts.drawings)],
    ["Stock Adjustments", String(counts.stockAdjustments)],
    ["Money Transfers", String(counts.transfers)]
  ]);

  const lastBackupRaw = localStorage.getItem(LAST_BACKUP_KEY);
  if (lastBackupRaw) {
    backupLastInfo.hidden = false;
    backupLastInfo.textContent = `Last backup: ${formatReportDate(new Date(lastBackupRaw))}`;
  } else {
    backupLastInfo.hidden = true;
  }
}

// Downloads a JSON backup of everything in NBA_BACKUP_KEYS. Purely reads
// data — never writes anything except the "last backup" timestamp, which
// is UI metadata, not business data.
function downloadBackupFile() {
  const backupObj = buildBackupObject();
  const filename = buildBackupFilename(backupObj.businessName, new Date());
  const json = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const now = new Date();
  localStorage.setItem(LAST_BACKUP_KEY, now.toISOString());

  backupSuccessMsg.hidden = false;
  backupSuccessMsg.innerHTML =
    `✓ Backup created successfully.<br>File: <strong>${escapeHtml(filename)}</strong><br>Backup date: ${formatReportDate(now)}`;

  renderBackupSummary();
  return filename;
}

backupNowBtn.addEventListener("click", () => {
  downloadBackupFile();
});

// ---- 8q2. Restore: read, validate, preview -------------------------------------

let pendingRestoreBackup = null;

function validateBackupObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return "This file is not a valid NBA backup.";
  }
  if (obj.app !== BACKUP_APP_NAME) {
    return "This file is not a valid NBA backup.";
  }
  if (typeof obj.backupVersion !== "number") {
    return "This file is not a valid NBA backup.";
  }
  if (!obj.data || typeof obj.data !== "object" || Array.isArray(obj.data)) {
    return "Backup file appears to be corrupted or incomplete.";
  }
  for (const field of BACKUP_ARRAY_FIELDS) {
    const value = obj.data[field];
    if (value !== null && value !== undefined && !Array.isArray(value)) {
      return "Backup file appears to be corrupted or incomplete.";
    }
  }
  return null; // valid
}

function computeBackupFileCounts(data) {
  return {
    products: (data.inventory || []).length,
    sales: (data.sales || []).length,
    purchases: (data.purchases || []).length,
    customers: (data.customers || []).length,
    suppliers: (data.suppliers || []).length,
    expenses: (data.expenses || []).length,
    drawings: (data.drawings || []).length,
    stockAdjustments: (data.inventoryAdjustments || []).length,
    transfers: (data.moneyTransfers || []).length
  };
}

function showRestoreError(message) {
  restoreErrorMsg.hidden = false;
  restoreErrorMsg.textContent = message;
  restoreFileInput.value = "";
}

restoreFileInput.addEventListener("change", () => {
  const file = restoreFileInput.files[0];
  if (!file) return;

  restoreErrorMsg.hidden = true;

  const looksLikeJson = file.type === "application/json" || file.name.toLowerCase().endsWith(".json");
  if (!looksLikeJson) {
    showRestoreError("Please select a valid NBA backup file.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(String(reader.result));
    } catch (e) {
      showRestoreError("Backup file appears to be corrupted or incomplete.");
      return;
    }

    const error = validateBackupObject(parsed);
    if (error) {
      showRestoreError(error);
      return;
    }

    pendingRestoreBackup = parsed;
    openRestoreConfirmModal(parsed);
  };

  reader.onerror = () => {
    showRestoreError("Backup file appears to be corrupted or incomplete.");
  };

  reader.readAsText(file);
});

function openRestoreConfirmModal(backup) {
  const counts = computeBackupFileCounts(backup.data);
  restoreConfirmBusinessName.textContent = backup.businessName || "(unnamed business)";
  restoreConfirmDate.textContent = backup.createdAt ? formatReportDate(new Date(backup.createdAt)) : "Unknown date";
  renderStatGrid(restoreConfirmGrid, [
    ["Products", String(counts.products)],
    ["Sales", String(counts.sales)],
    ["Purchases", String(counts.purchases)],
    ["Customers", String(counts.customers)],
    ["Suppliers", String(counts.suppliers)],
    ["Expenses", String(counts.expenses)],
    ["Drawings", String(counts.drawings)],
    ["Stock Adjustments", String(counts.stockAdjustments)],
    ["Money Transfers", String(counts.transfers)]
  ]);
  restoreConfirmOverlay.hidden = false;
}

function closeRestoreConfirmModal() {
  restoreConfirmOverlay.hidden = true;
  pendingRestoreBackup = null;
  restoreFileInput.value = "";
}

cancelRestoreBtn.addEventListener("click", closeRestoreConfirmModal);

backupThenRestoreBtn.addEventListener("click", () => {
  downloadBackupFile();
  if (!pendingRestoreBackup) return;
  performRestore(pendingRestoreBackup);
});

confirmRestoreBtn.addEventListener("click", () => {
  if (!pendingRestoreBackup) return;
  performRestore(pendingRestoreBackup);
});

// Writes every key from the backup's data into localStorage. A snapshot of
// the current values is taken first, so if anything throws mid-write (e.g.
// storage quota exceeded), everything is rolled back rather than leaving
// NBA half-restored. This never creates, edits, or deletes a transaction —
// it only replaces the stored records wholesale with the backup's own copies.
function performRestore(backup) {
  const data = backup.data || {};

  const snapshot = {};
  Object.values(NBA_BACKUP_KEYS).forEach((key) => {
    snapshot[key] = localStorage.getItem(key);
  });

  try {
    Object.entries(NBA_BACKUP_KEYS).forEach(([field, key]) => {
      const value = data[field];
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else if (typeof value === "number") {
        localStorage.setItem(key, String(value));
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
  } catch (e) {
    Object.entries(snapshot).forEach(([key, value]) => {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    });
    restoreConfirmOverlay.hidden = true;
    pendingRestoreBackup = null;
    restoreFileInput.value = "";
    alert("Restore failed and your previous data was kept safe. Please try again.");
    return;
  }

  // NBA V2 — restore writes localStorage directly (not through the wrapped
  // save*() functions), so without this line the cloud copy would silently
  // go stale after a manual restore. pushBusinessSnapshotToCloud() is
  // defined later in this file (function declarations are hoisted) and is a
  // no-op if cloud sync isn't active.
  pushBusinessSnapshotToCloud();

  restoreConfirmOverlay.hidden = true;
  pendingRestoreBackup = null;

  alert("✓ NBA data restored successfully. NBA will now reload.");
  window.location.reload();
}



// ============================================================
// MODULE 18 — ALERTS & NOTIFICATIONS V1
// Read-only. Never creates, edits, or deletes any transaction.
// Every alert is computed live from real data using the existing
// shared calculation engine (computeInventoryReportData,
// computeReceivablesReport, computePayablesReport, computeExpensesReport,
// getRangeBounds/getFilteredExpenses) — no separate/competing engine.
// ============================================================

function computeActiveAlerts() {
  const settings = loadSettings();
  const alerts = { critical: [], warning: [], info: [] };

  if (settings.alerts.lowStock !== false) {
    const inventoryData = computeInventoryReportData();
    inventoryData.lowStock.forEach((p) => {
      const qty = Number(p.quantity) || 0;
      alerts.critical.push({
        id: "lowstock-" + p.id,
        icon: "🔴",
        title: "Low Stock",
        name: p.name,
        description: `Only ${qty} unit${qty === 1 ? "" : "s"} remaining.`,
        actionLabel: "View Inventory",
        action: () => selectDashSection("inventory")
      });
    });
  }

  if (settings.alerts.customerDebt !== false) {
    computeReceivablesReport().rows.forEach((r) => {
      alerts.warning.push({
        id: "receivable-" + r.id,
        icon: "🟠",
        title: "Customer Payment Due",
        name: r.name,
        description: `${r.name} owes ${formatNaira(r.balance)}.`,
        actionLabel: "View Customer",
        action: () => {
          selectDashSection("customers");
          if (r.id) showCustomerDetailView(r.id);
        }
      });
    });
  }

  if (settings.alerts.supplierPayable !== false) {
    computePayablesReport().rows.forEach((r) => {
      alerts.warning.push({
        id: "payable-" + r.id,
        icon: "🟠",
        title: "Supplier Payment Due",
        name: r.name,
        description: `You owe ${r.name} ${formatNaira(r.owed)}.`,
        actionLabel: "View Supplier",
        action: () => {
          selectDashSection("suppliers");
          if (r.id) showSupplierDetailView(r.id);
        }
      });
    });
  }

  if (settings.alerts.noSales !== false) {
    const todaysSalesCount = loadSales().filter((s) => isToday(s.createdAt)).length;
    if (todaysSalesCount === 0) {
      alerts.info.push({
        id: "nosales",
        icon: "ℹ️",
        title: "No Sales Today",
        description: "No sales recorded for today yet.",
        actionLabel: "New Sale",
        action: () => {
          selectDashSection("sales");
          openNewSaleForm();
        }
      });
    }
  }

  if (settings.alerts.expenseSummary !== false) {
    const bounds = getRangeBounds("thisMonth", null, null);
    const expensesReport = computeExpensesReport(getFilteredExpenses(bounds));
    alerts.info.push({
      id: "expenses-month",
      icon: "ℹ️",
      title: "Expenses This Month",
      description: `Expenses this month: ${formatNaira(expensesReport.total)}.`,
      actionLabel: "View Expenses",
      action: () => selectDashSection("expenses")
    });
  }

  if (settings.alerts.backupReminder !== false) {
    const lastBackupRaw = localStorage.getItem(LAST_BACKUP_KEY);
    const daysSince = lastBackupRaw ? (Date.now() - new Date(lastBackupRaw).getTime()) / 86400000 : Infinity;
    if (!lastBackupRaw || daysSince > 7) {
      alerts.warning.push({
        id: "backup",
        icon: "⚠️",
        title: "Backup Reminder",
        description: lastBackupRaw
          ? "You haven't backed up your data recently."
          : "You haven't created a recent backup.",
        actionLabel: "Back Up Now",
        action: () => selectDashSection("settings")
      });
    }
  }

  return alerts;
}

function countActionableAlerts() {
  const a = computeActiveAlerts();
  return a.critical.length + a.warning.length;
}

function updateAlertsBadge() {
  if (!navAlertsBtn) return;
  const count = countActionableAlerts();
  navAlertsBtn.textContent = count > 0 ? `🔔 Alerts (${count})` : "🔔 Alerts";
}

let currentAlertsActionMap = {};

function renderAlertsPage() {
  const alerts = computeActiveAlerts();
  updateAlertsBadge();

  const total = alerts.critical.length + alerts.warning.length + alerts.info.length;
  if (total === 0) {
    currentAlertsActionMap = {};
    alertsListContainer.innerHTML = `
      <div class="alerts-empty-state">
        <div class="alerts-empty-icon">✓</div>
        <h2>You're all caught up</h2>
        <p>No important business alerts right now.</p>
      </div>
    `;
    return;
  }

  function renderGroup(label, items) {
    if (items.length === 0) return "";
    return `
      <div class="alert-group">
        <h3 class="report-subtitle">${escapeHtml(label)}</h3>
        ${items
          .map(
            (a) => `
          <div class="alert-card">
            <div class="alert-card-icon">${a.icon}</div>
            <div class="alert-card-body">
              <div class="alert-card-title">${escapeHtml(a.title)}</div>
              ${a.name ? `<div class="alert-card-name">${escapeHtml(a.name)}</div>` : ""}
              <div class="alert-card-desc">${escapeHtml(a.description)}</div>
            </div>
            <button type="button" class="btn-secondary btn-compact alert-card-action" data-alert-id="${a.id}">${escapeHtml(a.actionLabel)}</button>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  currentAlertsActionMap = {};
  [...alerts.critical, ...alerts.warning, ...alerts.info].forEach((a) => {
    currentAlertsActionMap[a.id] = a.action;
  });

  alertsListContainer.innerHTML =
    renderGroup("Critical", alerts.critical) +
    renderGroup("Warnings", alerts.warning) +
    renderGroup("Information", alerts.info);
}

if (alertsListContainer) {
  alertsListContainer.addEventListener("click", (event) => {
    const btn = event.target.closest(".alert-card-action");
    if (!btn) return;
    const action = currentAlertsActionMap[btn.dataset.alertId];
    if (action) action();
  });
}

// ============================================================
// MODULE 19 — GLOBAL SEARCH V1
// Read-only. Searches existing storage directly; never creates,
// edits, or deletes any record, transaction, or balance.
// ============================================================

function runGlobalSearch(term) {
  const q = term.trim().toLowerCase();
  if (!q) return null;

  const business = loadBusiness() || {};
  const matchBusiness = [business.businessName, business.ownerName, business.phone, business.address, business.state]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));

  const products = loadInventory().filter((p) =>
    [p.name, p.sku, p.category].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  );

  const customers = loadCustomers().filter((c) =>
    [c.name, c.phone, c.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  );

  const suppliers = loadSuppliers().filter((s) =>
    [s.name, s.phone, s.email].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  );

  const sales = loadSales().filter((s) => {
    const idMatch = String(s.id || "").toLowerCase().includes(q);
    const customerMatch = (s.customerName || "").toLowerCase().includes(q);
    const productMatch = (s.items || []).some((it) => (it.name || "").toLowerCase().includes(q));
    const methodMatch = (s.paymentMethod || "").toLowerCase().includes(q) || (s.paymentType || "").toLowerCase().includes(q);
    return idMatch || customerMatch || productMatch || methodMatch;
  });

  const purchases = loadPurchases().filter((p) => {
    const idMatch = String(p.id || "").toLowerCase().includes(q) || (p.purchaseNumber || "").toLowerCase().includes(q);
    const supplierMatch = (p.supplierName || "").toLowerCase().includes(q);
    const productMatch = (p.items || []).some((it) => (it.name || "").toLowerCase().includes(q));
    const methodMatch = (p.paymentMethod || "").toLowerCase().includes(q);
    return idMatch || supplierMatch || productMatch || methodMatch;
  });

  const expenses = loadExpenses().filter((e) =>
    [e.category, e.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  );

  const drawings = loadDrawings().filter((d) =>
    [d.reason, d.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  );

  return {
    business: matchBusiness ? business : null,
    products,
    customers,
    suppliers,
    sales,
    purchases,
    expenses,
    drawings
  };
}

function renderGlobalSearchResults(term) {
  const q = term.trim();
  const results = runGlobalSearch(q);
  const groups = [];
  const MAX_PER_GROUP = 8;

  if (results.business) {
    groups.push({
      label: "Business",
      items: [
        {
          type: "business",
          id: "business",
          title: results.business.businessName || "Your Business",
          sub: [results.business.ownerName, results.business.phone].filter(Boolean).join(" · ")
        }
      ]
    });
  }

  if (results.products.length) {
    groups.push({
      label: `Products (${results.products.length})`,
      items: results.products.slice(0, MAX_PER_GROUP).map((p) => ({
        type: "product",
        id: p.id,
        title: p.name,
        sub: `${Number(p.quantity) || 0} units · ${formatNaira(p.sellingPrice)}`
      }))
    });
  }

  if (results.customers.length) {
    groups.push({
      label: `Customers (${results.customers.length})`,
      items: results.customers.slice(0, MAX_PER_GROUP).map((c) => {
        const balance = getCustomerStats(c.id).balance;
        return {
          type: "customer",
          id: c.id,
          title: c.name,
          sub: balance > 0 ? `${formatNaira(balance)} owing` : c.phone || ""
        };
      })
    });
  }

  if (results.suppliers.length) {
    groups.push({
      label: `Suppliers (${results.suppliers.length})`,
      items: results.suppliers.slice(0, MAX_PER_GROUP).map((s) => {
        const owed = getSupplierStats(s.id).owed;
        return {
          type: "supplier",
          id: s.id,
          title: s.name,
          sub: owed > 0 ? `You owe ${formatNaira(owed)}` : s.phone || ""
        };
      })
    });
  }

  if (results.sales.length) {
    groups.push({
      label: `Sales (${results.sales.length})`,
      items: results.sales.slice(0, MAX_PER_GROUP).map((s) => ({
        type: "sale",
        id: s.id,
        title: `${formatNaira(s.total)} · ${s.customerName || "Walk-in Customer"}`,
        sub: new Date(s.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
      }))
    });
  }

  if (results.purchases.length) {
    groups.push({
      label: `Purchases (${results.purchases.length})`,
      items: results.purchases.slice(0, MAX_PER_GROUP).map((p) => ({
        type: "purchase",
        id: p.id,
        title: `${formatNaira(p.total)} · ${p.supplierName}`,
        sub: new Date(p.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })
      }))
    });
  }

  if (results.expenses.length) {
    groups.push({
      label: `Expenses (${results.expenses.length})`,
      items: results.expenses.slice(0, MAX_PER_GROUP).map((e) => ({
        type: "expense",
        id: e.id,
        title: e.category,
        sub: `${formatNaira(e.amount)}${e.description ? " · " + e.description : ""}`
      }))
    });
  }

  if (results.drawings.length) {
    groups.push({
      label: `Drawings (${results.drawings.length})`,
      items: results.drawings.slice(0, MAX_PER_GROUP).map((d) => ({
        type: "drawing",
        id: d.id,
        title: d.reason,
        sub: `${formatNaira(d.amount)}${d.description ? " · " + d.description : ""}`
      }))
    });
  }

  globalSearchResults.hidden = false;

  if (groups.length === 0) {
    globalSearchResults.innerHTML = `
      <div class="search-empty-state">
        <p>No results found for:</p>
        <p class="search-empty-term">"${escapeHtml(q)}"</p>
        <p class="report-note">Try another search.</p>
      </div>
    `;
    return;
  }

  globalSearchResults.innerHTML = groups
    .map(
      (g) => `
      <div class="search-result-group">
        <div class="search-result-group-label">${escapeHtml(g.label)}</div>
        ${g.items
          .map(
            (it) => `
          <button type="button" class="search-result-item" data-type="${it.type}" data-id="${escapeHtml(String(it.id))}">
            <span class="search-result-title">${escapeHtml(it.title || "")}</span>
            ${it.sub ? `<span class="search-result-sub">${escapeHtml(it.sub)}</span>` : ""}
          </button>
        `
          )
          .join("")}
      </div>
    `
    )
    .join("");
}

function closeGlobalSearchResults() {
  globalSearchResults.hidden = true;
  globalSearchResults.innerHTML = "";
}

if (globalSearchInput) {
  globalSearchInput.addEventListener("input", () => {
    const term = globalSearchInput.value;
    globalSearchClearBtn.hidden = term.trim().length === 0;
    if (!term.trim()) {
      closeGlobalSearchResults();
      return;
    }
    renderGlobalSearchResults(term);
  });

  globalSearchInput.addEventListener("focus", () => {
    if (globalSearchInput.value.trim()) renderGlobalSearchResults(globalSearchInput.value);
  });

  globalSearchClearBtn.addEventListener("click", () => {
    globalSearchInput.value = "";
    globalSearchClearBtn.hidden = true;
    closeGlobalSearchResults();
    globalSearchInput.focus();
  });

  globalSearchResults.addEventListener("click", (event) => {
    const item = event.target.closest(".search-result-item");
    if (!item) return;
    const type = item.dataset.type;
    const id = item.dataset.id;
    closeGlobalSearchResults();
    globalSearchInput.blur();

    if (type === "business") selectDashSection("settings");
    else if (type === "product") selectDashSection("inventory");
    else if (type === "customer") {
      selectDashSection("customers");
      showCustomerDetailView(id);
    } else if (type === "supplier") {
      selectDashSection("suppliers");
      showSupplierDetailView(id);
    } else if (type === "sale") {
      selectDashSection("sales");
      openReceiptModal(id, { justCompleted: false });
    } else if (type === "purchase") {
      selectDashSection("purchases");
      expandedPurchaseId = id;
      renderPurchaseList();
    } else if (type === "expense") {
      selectDashSection("expenses");
      openEditExpenseForm(id);
    } else if (type === "drawing") {
      selectDashSection("drawings");
      openEditDrawingForm(id);
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !globalSearchResults.hidden &&
      !event.target.closest(".dash-search-bar") &&
      !event.target.closest(".dash-search-results")
    ) {
      closeGlobalSearchResults();
    }
  });
}

// ============================================================
// MODULE 20 — SETTINGS & BUSINESS CUSTOMIZATION V1
// Only configuration/display behaviour changes here. Nothing in this
// module edits historical sales, purchases, expenses, drawings,
// payments, inventory quantities, or balances.
// ============================================================

function renderSettingsSummary() {
  const business = loadBusiness() || {};
  if (settingsSummaryGrid) {
    renderStatGrid(settingsSummaryGrid, [
      ["Business Name", business.businessName || "—"],
      ["Business Type", business.businessType || "—"],
      ["Location", [business.state, business.country].filter(Boolean).join(", ") || "—"],
      ["Owner", business.ownerName || "—"],
      ["Phone", business.phone || "—"]
    ]);
  }
}

function fillSettingsForm() {
  const s = loadSettings();
  if (settingsCurrencySymbol) settingsCurrencySymbol.value = s.currencySymbol;
  if (settingsDateFormat) settingsDateFormat.value = s.dateFormat;
  if (settingsDefaultPaymentMethod) settingsDefaultPaymentMethod.value = s.defaultPaymentMethod || "";
  if (settingsLowStockThreshold) settingsLowStockThreshold.value = s.lowStockThreshold;
  if (settingsReceiptHeaderName) settingsReceiptHeaderName.value = s.receiptHeaderName;
  if (settingsReceiptPhone) settingsReceiptPhone.value = s.receiptPhone;
  if (settingsReceiptAddress) settingsReceiptAddress.value = s.receiptAddress;
  if (settingsReceiptFooter) settingsReceiptFooter.value = s.receiptFooter;
  if (settingsAlertLowStock) settingsAlertLowStock.checked = s.alerts.lowStock !== false;
  if (settingsAlertCustomerDebt) settingsAlertCustomerDebt.checked = s.alerts.customerDebt !== false;
  if (settingsAlertSupplierPayable) settingsAlertSupplierPayable.checked = s.alerts.supplierPayable !== false;
  if (settingsAlertNoSales) settingsAlertNoSales.checked = s.alerts.noSales !== false;
  if (settingsAlertExpenseSummary) settingsAlertExpenseSummary.checked = s.alerts.expenseSummary !== false;
  if (settingsAlertBackupReminder) settingsAlertBackupReminder.checked = s.alerts.backupReminder !== false;
  if (settingsVoiceAssistantEnabled) settingsVoiceAssistantEnabled.checked = s.voiceAssistantEnabled !== false;
}

function showSettingsSavedMessage(text) {
  if (!settingsSavedMsg) return;
  settingsSavedMsg.textContent = text;
  settingsSavedMsg.hidden = false;
  setTimeout(() => {
    settingsSavedMsg.hidden = true;
  }, 2500);
}

function persistSettingsPatch(patch) {
  const current = loadSettings();
  const merged = Object.assign({}, current, patch, {
    alerts: Object.assign({}, current.alerts, patch.alerts || {})
  });
  saveSettings(merged);
}

if (savePreferencesBtn) {
  savePreferencesBtn.addEventListener("click", () => {
    persistSettingsPatch({
      currencySymbol: settingsCurrencySymbol.value.trim() || "₦",
      dateFormat: settingsDateFormat.value,
      defaultPaymentMethod: settingsDefaultPaymentMethod.value
    });
    renderDashboard();
    showSettingsSavedMessage("✓ Preferences saved.");
  });
}

if (saveInventorySettingsBtn) {
  saveInventorySettingsBtn.addEventListener("click", () => {
    const n = Number(settingsLowStockThreshold.value);
    persistSettingsPatch({ lowStockThreshold: Number.isFinite(n) && n >= 0 ? n : 5 });
    renderDashboard();
    showSettingsSavedMessage("✓ Inventory settings saved. Stock quantities were not changed.");
  });
}

if (saveReceiptSettingsBtn) {
  saveReceiptSettingsBtn.addEventListener("click", () => {
    persistSettingsPatch({
      receiptHeaderName: settingsReceiptHeaderName.value.trim(),
      receiptPhone: settingsReceiptPhone.value.trim(),
      receiptAddress: settingsReceiptAddress.value.trim(),
      receiptFooter: settingsReceiptFooter.value.trim() || "Thank you for your business."
    });
    showSettingsSavedMessage("✓ Receipt settings saved. Past receipts are unaffected.");
  });
}

function wireAlertToggle(el, key) {
  if (!el) return;
  el.addEventListener("change", () => {
    const patch = { alerts: {} };
    patch.alerts[key] = el.checked;
    persistSettingsPatch(patch);
    updateAlertsBadge();
    showSettingsSavedMessage("✓ Alert settings saved.");
  });
}

wireAlertToggle(settingsAlertLowStock, "lowStock");
wireAlertToggle(settingsAlertCustomerDebt, "customerDebt");
wireAlertToggle(settingsAlertSupplierPayable, "supplierPayable");
wireAlertToggle(settingsAlertNoSales, "noSales");
wireAlertToggle(settingsAlertExpenseSummary, "expenseSummary");
wireAlertToggle(settingsAlertBackupReminder, "backupReminder");

if (settingsVoiceAssistantEnabled) {
  settingsVoiceAssistantEnabled.addEventListener("change", () => {
    persistSettingsPatch({ voiceAssistantEnabled: settingsVoiceAssistantEnabled.checked });
    updateVoiceFabVisibility();
    showSettingsSavedMessage("✓ Voice Assistant setting saved.");
  });
}

function renderSettingsSection() {
  renderSettingsSummary();
  fillSettingsForm();
  renderBackupSummary();
}

// ---- 9. Form submit -----------------------------------------------------------

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const result = validateForm();

  if (!result.valid) {
    formErrorSummary.hidden = false;
    formErrorSummary.textContent =
      result.count === 1
        ? "Please fix the highlighted field before continuing."
        : `Please fix ${result.count} highlighted fields before continuing.`;
    if (result.firstInvalid) {
      result.firstInvalid.focus();
      result.firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  formErrorSummary.hidden = true;
  const data = collectFormData();
  saveBusiness(data);
  updatePreview();
  showSuccessView();
});

editBtn.addEventListener("click", () => {
  showFormView();
  fields.businessName.focus();
});


/* ============================================================
   VOICE ASSISTANT V1
   ============================================================
   Voice is only an input method. Every action that changes data
   calls the SAME functions the normal screens already use:
     addSale, addStockToProduct, addExpense,
     addCustomerPayment, addSupplierPayment, selectDashSection.
   This module never recalculates money on its own and never
   writes data without an explicit "Yes, Proceed".
   ============================================================ */

// ---- 1. Element references ---------------------------------------------------

const voiceFabBtn = document.getElementById("voiceFabBtn");
const voiceOverlay = document.getElementById("voiceOverlay");
const voiceCloseBtn = document.getElementById("voiceCloseBtn");
const voiceStateIcon = document.getElementById("voiceStateIcon");
const voiceStatusText = document.getElementById("voiceStatusText");
const voiceHeardBlock = document.getElementById("voiceHeardBlock");
const voiceHeardText = document.getElementById("voiceHeardText");
const voiceUnderstoodBlock = document.getElementById("voiceUnderstoodBlock");
const voiceUnderstoodRows = document.getElementById("voiceUnderstoodRows");
const voiceChoiceList = document.getElementById("voiceChoiceList");
const voiceResponseText = document.getElementById("voiceResponseText");
const voiceConfirmRow = document.getElementById("voiceConfirmRow");
const voiceNoBtn = document.getElementById("voiceNoBtn");
const voiceYesBtn = document.getElementById("voiceYesBtn");
const voiceRetryRow = document.getElementById("voiceRetryRow");
const voiceCloseErrorBtn = document.getElementById("voiceCloseErrorBtn");
const voiceTryAgainBtn = document.getElementById("voiceTryAgainBtn");
const voiceMicBigBtn = document.getElementById("voiceMicBigBtn");
const voiceMicBigIcon = document.getElementById("voiceMicBigIcon");
const voiceMicHint = document.getElementById("voiceMicHint");

// ---- 2. Speech recognition setup ----------------------------------------------

const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const VOICE_SUPPORTED = !!SpeechRecognitionCtor;
let voiceRecognizer = null;
let voiceListeningActive = false;

function createRecognizer() {
  if (!VOICE_SUPPORTED) return null;
  const r = new SpeechRecognitionCtor();
  r.lang = "en-NG";
  r.continuous = false;
  r.interimResults = false;
  r.maxAlternatives = 1;
  return r;
}

// ---- 3. Fab button visibility --------------------------------------------------

function updateVoiceFabVisibility() {
  if (!voiceFabBtn) return;
  const enabled = loadSettings().voiceAssistantEnabled !== false;
  voiceFabBtn.hidden = !enabled;
}

if (voiceFabBtn) {
  voiceFabBtn.addEventListener("click", () => {
    openVoiceModal();
  });
}

// ---- 4. Modal open/close + state rendering -------------------------------------

let voicePendingAction = null; // { onConfirm, onCancel } while in CONFIRMATION state
let voiceLastFailedTranscript = null; // used by "Try Again" after an error/clarify

function resetVoiceModalBlocks() {
  voiceHeardBlock.hidden = true;
  voiceHeardText.textContent = "";
  voiceUnderstoodBlock.hidden = true;
  voiceUnderstoodRows.innerHTML = "";
  voiceChoiceList.hidden = true;
  voiceChoiceList.innerHTML = "";
  voiceResponseText.hidden = true;
  voiceResponseText.textContent = "";
  voiceResponseText.classList.remove("is-error", "is-success");
  voiceConfirmRow.hidden = true;
  voiceRetryRow.hidden = true;
  voicePendingAction = null;
}

function setVoiceIcon(icon, listening) {
  voiceStateIcon.textContent = icon;
  voiceStateIcon.classList.toggle("is-listening", !!listening);
}

function openVoiceModal() {
  if (!VOICE_SUPPORTED) {
    resetVoiceModalBlocks();
    voiceOverlay.hidden = false;
    setVoiceIcon("⚠", false);
    voiceStatusText.textContent = "Not supported";
    voiceResponseText.hidden = false;
    voiceResponseText.classList.add("is-error");
    voiceResponseText.textContent = "Voice input isn't supported by this browser. You can still use NBA normally.";
    voiceMicBigBtn.hidden = true;
    voiceMicHint.hidden = true;
    return;
  }
  resetVoiceModalBlocks();
  voiceOverlay.hidden = false;
  voiceMicBigBtn.hidden = false;
  voiceMicHint.hidden = false;
  setVoiceIcon("🎙️", false);
  voiceStatusText.textContent = "Tap to speak";
  voiceMicHint.textContent = "Tap the microphone and speak naturally.";
}

function closeVoiceModal() {
  stopListening();
  voiceOverlay.hidden = true;
  resetVoiceModalBlocks();
}

voiceCloseBtn.addEventListener("click", closeVoiceModal);
voiceCloseErrorBtn.addEventListener("click", closeVoiceModal);

// Tapping outside the modal card closes it too, same pattern as other overlays
// in NBA (receipt modal) — but never while actively listening, so a stray tap
// can't silently drop what the user is in the middle of saying.
voiceOverlay.addEventListener("click", (event) => {
  if (event.target === voiceOverlay && !voiceListeningActive) {
    closeVoiceModal();
  }
});

// ---- 5. Listening lifecycle -----------------------------------------------------

function startListening() {
  if (!VOICE_SUPPORTED) return;

  voiceRecognizer = createRecognizer();
  resetVoiceModalBlocks();
  setVoiceIcon("🔴", true);
  voiceStatusText.textContent = "Listening...";
  voiceMicBigBtn.classList.add("is-listening");
  voiceMicHint.textContent = "Listening — speak now.";
  voiceListeningActive = true;

  voiceRecognizer.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    handleTranscript(transcript);
  };

  voiceRecognizer.onerror = (event) => {
    voiceListeningActive = false;
    voiceMicBigBtn.classList.remove("is-listening");
    if (event.error === "not-allowed" || event.error === "permission-denied") {
      showVoiceError(
        "Microphone permission was denied. Please allow microphone access in your browser settings if you want to use voice input.",
        false
      );
      return;
    }
    if (event.error === "no-speech") {
      showVoiceError("No speech detected.", true);
      return;
    }
    showVoiceError("Sorry, I couldn't understand that.", true);
  };

  voiceRecognizer.onend = () => {
    voiceListeningActive = false;
    voiceMicBigBtn.classList.remove("is-listening");
  };

  try {
    voiceRecognizer.start();
  } catch (e) {
    voiceListeningActive = false;
    showVoiceError("Sorry, I couldn't understand that.", true);
  }
}

function stopListening() {
  if (voiceRecognizer && voiceListeningActive) {
    try {
      voiceRecognizer.stop();
    } catch (e) {
      // ignore — recognizer may already be stopped
    }
  }
  voiceListeningActive = false;
  voiceMicBigBtn.classList.remove("is-listening");
}

voiceMicBigBtn.addEventListener("click", () => {
  if (voiceListeningActive) {
    stopListening();
    return;
  }
  startListening();
});

voiceTryAgainBtn.addEventListener("click", () => {
  resetVoiceModalBlocks();
  setVoiceIcon("🎙️", false);
  voiceStatusText.textContent = "Tap to speak";
  voiceMicBigBtn.hidden = false;
  voiceMicHint.hidden = false;
  voiceMicHint.textContent = "Tap the microphone and speak naturally.";
});

function showVoiceError(message, allowRetry) {
  resetVoiceModalBlocks();
  setVoiceIcon("⚠", false);
  voiceStatusText.textContent = "Something went wrong";
  voiceResponseText.hidden = false;
  voiceResponseText.classList.add("is-error");
  voiceResponseText.textContent = message;
  voiceMicBigBtn.hidden = true;
  voiceMicHint.hidden = true;
  voiceRetryRow.hidden = false;
  voiceTryAgainBtn.hidden = !allowRetry;
  voiceCloseErrorBtn.textContent = allowRetry ? "Cancel" : "Close";
}

// ---- 6. Number / money parsing --------------------------------------------------

const VOICE_NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
};
const VOICE_SCALE_WORDS = { hundred: 100, thousand: 1000, million: 1000000 };

function voiceIsNumberWord(w) {
  return Object.prototype.hasOwnProperty.call(VOICE_NUMBER_WORDS, w) ||
    Object.prototype.hasOwnProperty.call(VOICE_SCALE_WORDS, w) ||
    w === "and";
}

function voiceWordsRunToNumber(tokens) {
  let total = 0;
  let current = 0;
  tokens.forEach((w) => {
    if (w === "and") return;
    if (Object.prototype.hasOwnProperty.call(VOICE_NUMBER_WORDS, w)) {
      current += VOICE_NUMBER_WORDS[w];
    } else if (w === "hundred") {
      current = (current || 1) * 100;
    } else if (w === "thousand" || w === "million") {
      current = (current || 1) * VOICE_SCALE_WORDS[w];
      total += current;
      current = 0;
    }
  });
  return total + current;
}

// Converts spoken number words ("forty thousand") into plain digits ("40000")
// wherever they appear in a transcript, leaving everything else untouched.
function wordsToDigitsText(text) {
  const rawTokens = text.split(/\s+/);
  const outTokens = [];
  let i = 0;
  while (i < rawTokens.length) {
    const clean = rawTokens[i].toLowerCase().replace(/[^a-z]/g, "");
    if (clean && voiceIsNumberWord(clean) && clean !== "and") {
      let j = i;
      const run = [];
      while (j < rawTokens.length) {
        const cw = rawTokens[j].toLowerCase().replace(/[^a-z]/g, "");
        if (cw && voiceIsNumberWord(cw)) {
          run.push(cw);
          j++;
        } else {
          break;
        }
      }
      // Trim a trailing lone "and" that isn't followed by more digits.
      while (run.length && run[run.length - 1] === "and") run.pop();
      if (run.length) {
        outTokens.push(String(voiceWordsRunToNumber(run)));
        i += run.length;
      } else {
        outTokens.push(rawTokens[i]);
        i++;
      }
    } else {
      outTokens.push(rawTokens[i]);
      i++;
    }
  }
  return outTokens.join(" ");
}

function titleCaseWords(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- 7. Entity matching (reuses the EXISTING product/customer/supplier data) ---

function findProductMatches(name) {
  const q = (name || "").toLowerCase().trim();
  if (!q) return [];
  return loadInventory().filter((p) => {
    const pn = (p.name || "").toLowerCase();
    return pn.includes(q) || q.includes(pn);
  });
}

function findCustomerMatches(name) {
  const q = (name || "").toLowerCase().trim();
  if (!q) return [];
  return loadCustomers().filter((c) => (c.name || "").toLowerCase().includes(q));
}

function findSupplierMatches(name) {
  const q = (name || "").toLowerCase().trim();
  if (!q) return [];
  return loadSuppliers().filter((s) => (s.name || "").toLowerCase().includes(q));
}

// ---- 8. Period + payment-method helpers (reuse the EXISTING report engine) -----

function voiceExtractPeriod(text) {
  if (/\bthis week\b/.test(text)) return { rangeType: "thisWeek", label: "this week" };
  if (/\bthis month\b/.test(text)) return { rangeType: "thisMonth", label: "this month" };
  if (/\bthis year\b/.test(text)) return { rangeType: "thisYear", label: "this year" };
  if (/\byesterday\b/.test(text)) return { rangeType: "yesterday", label: "yesterday" };
  return { rangeType: "today", label: "today" };
}

function voiceGuessPaymentMethod(text, allowPosAndTransfer) {
  if (allowPosAndTransfer && /\bpos\b/.test(text)) return "POS";
  if (allowPosAndTransfer && /\b(bank|transfer)\b/.test(text)) return "Bank Transfer";
  if (!allowPosAndTransfer && /\bbank\b/.test(text)) return "Bank";
  return "Cash";
}

const VOICE_EXPENSE_CATEGORIES = [
  "Rent", "Electricity", "Water", "Transport", "Staff / Wages", "Internet / Data",
  "Repairs", "Packaging", "Advertising", "Cleaning", "Maintenance", "Business Fees"
];

function voiceMatchExpenseCategory(description) {
  const q = (description || "").toLowerCase();
  const found = VOICE_EXPENSE_CATEGORIES.find((cat) => {
    const c = cat.toLowerCase();
    return q.includes(c) || c.includes(q);
  });
  return found || "Other";
}

// ---- 9. Command parsing (V1: a limited, deterministic set — never guesses) -----

function parseVoiceIntent(rawDisplayText) {
  const digitsText = wordsToDigitsText(rawDisplayText);
  const norm = digitsText.toLowerCase().replace(/[.,!?]+$/, "").trim();

  // Closing command
  if (/^(close assistant|stop listening|goodbye|bye|exit)\b/.test(norm)) {
    return { type: "close" };
  }

  // Navigation
  const navMap = [
    [/^(open|go to|show|navigate to)\s+inventory\b/, "inventory", "Inventory", false],
    [/^(open|go to|show|navigate to)\s+reports?\b/, "reports", "Reports", false],
    [/^(open|go to|show|navigate to)\s+customers?\b/, "customers", "Customers", false],
    [/^(open|go to|show|navigate to)\s+suppliers?\b/, "suppliers", "Suppliers", false],
    [/^(open|go to|show|navigate to)\s+backup\b/, "settings", "Backup & Restore", true],
    [/^(open|go to|show|navigate to)\s+settings\b/, "settings", "Settings", false],
    [/^(show|open)\s+alerts\b/, "alerts", "Alerts", false],
    [/^(open|go to|show|navigate to)\s+sales\b/, "sales", "Sales", false],
    [/^(open|go to|show|navigate to)\s+expenses\b/, "expenses", "Expenses", false],
    [/^(open|go to|show|navigate to)\s+drawings\b/, "drawings", "Drawings", false],
    [/^(open|go to|show|navigate to)\s+dashboard\b/, "dashboard", "Dashboard", false]
  ];
  for (let k = 0; k < navMap.length; k++) {
    const [re, section, label, scrollBackup] = navMap[k];
    if (re.test(norm)) return { type: "navigate", section, label, scrollBackup };
  }

  // Search
  let m = norm.match(/^search(?:\s+for)?\s+(.+)$/);
  if (m) return { type: "search", term: m[1].trim() };

  // Profit
  if (/\bprofit\b/.test(norm)) {
    return { type: "checkProfit", period: voiceExtractPeriod(norm) };
  }

  // Sales
  if ((/\bsold\b/.test(norm) || /\bsales\b/.test(norm)) && /how much|what/.test(norm)) {
    return { type: "checkSales", period: voiceExtractPeriod(norm) };
  }

  // Individual customer balance
  m = norm.match(/how much does (.+?) owe me/);
  if (m) return { type: "checkCustomerBalance", name: m[1].trim() };

  // Aggregate receivables
  if (/who owes me( money)?\b|customers? owing\b|\breceivables\b/.test(norm)) {
    return { type: "checkReceivablesTotal" };
  }

  // Individual supplier balance / aggregate payables
  m = norm.match(/how much do i owe (.+)/);
  if (m) {
    const who = m[1].trim();
    if (/^suppliers?$|^my suppliers?$/.test(who)) return { type: "checkPayablesTotal" };
    return { type: "checkSupplierBalance", name: who };
  }
  if (/\bpayables\b/.test(norm)) return { type: "checkPayablesTotal" };

  // Inventory value / specific product stock
  m = norm.match(/check inventory (?:of|for)\s+(.+)/);
  if (m) return { type: "checkProductStock", name: m[1].trim() };
  if (/inventory value|worth of my inventory|how much is my inventory|^check inventory$/.test(norm)) {
    return { type: "checkInventoryValue" };
  }

  // Add expense: "record/add an expense of X for Y"
  m = norm.match(/^(?:record|add)\s+an?\s+expense\s+of\s+([\d.]+)\s+for\s+(.+)$/);
  if (m) return { type: "addExpense", amount: parseFloat(m[1]), description: m[2].trim(), rawText: norm };

  // Customer payment: "<name> paid me <amount>"
  m = norm.match(/^(.+?)\s+paid\s+me\s+([\d.]+)/);
  if (m) return { type: "customerPayment", name: m[1].trim(), amount: parseFloat(m[2]), rawText: norm };

  // Supplier payment: "pay <name> <amount>"
  m = norm.match(/^pay\s+(.+?)\s+([\d.]+)/);
  if (m) return { type: "supplierPayment", name: m[1].trim(), amount: parseFloat(m[2]), rawText: norm };

  // New sale: "sell X [unit] of Y [to CUSTOMER] for AMOUNT"
  m = norm.match(/^sell\s+(\d+)\s*(?:bags?|units?|pieces?|packs?|cartons?)?\s*(?:of\s+)?(.+?)(?:\s+to\s+(.+?))?\s+for\s+([\d.]+)/);
  if (m) {
    return {
      type: "newSale",
      qty: parseInt(m[1], 10),
      productName: m[2].trim(),
      customerName: m[3] ? m[3].trim() : null,
      total: parseFloat(m[4]),
      rawText: norm
    };
  }

  // Add product / stock: "add X [unit] of Y [at PRICE (naira) each]"
  m = norm.match(/^add\s+(\d+)\s*(?:bags?|units?|pieces?|packs?|cartons?)?\s*(?:of\s+)?(.+?)(?:\s+at\s+([\d.]+)\s*(?:naira|₦)?\s*each)?$/);
  if (m) {
    return {
      type: "addStock",
      qty: parseInt(m[1], 10),
      productName: m[2].replace(/\s+at$/, "").trim(),
      unitPrice: m[3] ? parseFloat(m[3]) : null
    };
  }

  // "Add <product>" with no quantity — ambiguous, ask for more info.
  m = norm.match(/^add\s+(.+)$/);
  if (m) {
    return {
      type: "clarify",
      message: `I can add ${titleCaseWords(m[1].trim())}, but I need the quantity and price. Try something like "Add 5 bags of ${titleCaseWords(m[1].trim())} at 5000 naira each."`
    };
  }

  return { type: "unknown" };
}

// ---- 10. Transcript handling -----------------------------------------------------

function handleTranscript(rawTranscript) {
  voiceListeningActive = false;
  setVoiceIcon("⏳", false);
  voiceStatusText.textContent = "Processing...";
  voiceMicBigBtn.hidden = true;
  voiceMicHint.hidden = true;

  voiceHeardBlock.hidden = false;
  voiceHeardText.textContent = `"${rawTranscript}"`;

  const intent = parseVoiceIntent(rawTranscript);
  routeVoiceIntent(intent, rawTranscript);
}

// Confirmation-phrase detection while the modal is showing an active choice
// list or confirmation prompt is handled entirely through the on-screen
// buttons in V1 (per spec, button confirmation is preferred over parsing
// a second voice utterance for "yes"/"no").

function showVoiceUnderstoodRows(rows) {
  voiceUnderstoodBlock.hidden = false;
  voiceUnderstoodRows.innerHTML = rows
    .map((r) => `<div class="voice-understood-row"><span>${escapeHtml(r[0])}</span><span>${escapeHtml(r[1])}</span></div>`)
    .join("");
}

function showVoiceChoices(items, labelFn, onChoose) {
  voiceChoiceList.hidden = false;
  voiceChoiceList.innerHTML = items
    .map((item, idx) => `<button type="button" class="voice-choice-btn" data-idx="${idx}">${escapeHtml(labelFn(item))}</button>`)
    .join("");
  voiceStatusText.textContent = "Which one did you mean?";
  setVoiceIcon("❓", false);
  Array.from(voiceChoiceList.querySelectorAll(".voice-choice-btn")).forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      voiceChoiceList.hidden = true;
      voiceChoiceList.innerHTML = "";
      onChoose(items[idx]);
    });
  });
}

function showVoiceConfirmation(rows, onConfirm) {
  showVoiceUnderstoodRows(rows);
  voiceStatusText.textContent = "Should I proceed?";
  setVoiceIcon("❔", false);
  voiceConfirmRow.hidden = false;
  voicePendingAction = { onConfirm };
}

voiceYesBtn.addEventListener("click", () => {
  if (!voicePendingAction) return;
  const action = voicePendingAction;
  voicePendingAction = null;
  voiceConfirmRow.hidden = true;
  action.onConfirm();
});

voiceNoBtn.addEventListener("click", () => {
  voicePendingAction = null;
  voiceConfirmRow.hidden = true;
  showVoiceDone("Cancelled. Nothing was changed.", false);
});

function showVoiceDone(message, isSuccess) {
  resetVoiceModalBlocks();
  setVoiceIcon(isSuccess ? "✓" : "•", false);
  voiceStatusText.textContent = isSuccess ? "Done" : "Cancelled";
  voiceResponseText.hidden = false;
  if (isSuccess) voiceResponseText.classList.add("is-success");
  voiceResponseText.textContent = message;
  voiceMicBigBtn.hidden = false;
  voiceMicHint.hidden = false;
  voiceMicHint.textContent = "Tap the microphone to ask or do something else.";
}

function showVoiceAnswer(message) {
  resetVoiceModalBlocks();
  setVoiceIcon("✓", false);
  voiceStatusText.textContent = "Done";
  voiceResponseText.hidden = false;
  voiceResponseText.classList.add("is-success");
  voiceResponseText.textContent = message;
  voiceMicBigBtn.hidden = false;
  voiceMicHint.hidden = false;
  voiceMicHint.textContent = "Tap the microphone to ask or do something else.";
}

// ---- 11. Routing intents to existing NBA functions -------------------------------

function routeVoiceIntent(intent, rawTranscript) {
  switch (intent.type) {

    case "close": {
      closeVoiceModal();
      return;
    }

    case "navigate": {
      selectDashSection(intent.section);
      if (intent.scrollBackup) {
        const el = document.getElementById("backupSection");
        if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
      showVoiceAnswer(`✓ Opened ${intent.label}.`);
      return;
    }

    case "search": {
      if (globalSearchInput) {
        globalSearchInput.value = intent.term;
        globalSearchInput.dispatchEvent(new Event("input"));
      }
      showVoiceAnswer(`✓ Searching for "${intent.term}".`);
      return;
    }

    case "checkProfit": {
      const bounds = getRangeBounds(intent.period.rangeType, null, null);
      const sales = getFilteredSales(bounds);
      const expenses = getFilteredExpenses(bounds);
      const grossProfit = sales.reduce((sum, s) => sum + computeSaleProfit(s), 0);
      const expensesTotal = computeExpensesReport(expenses).total;
      const netProfit = grossProfit - expensesTotal;
      showVoiceAnswer(`Your net profit ${intent.period.label} is ${formatNaira(netProfit)} (${formatNaira(grossProfit)} gross profit minus ${formatNaira(expensesTotal)} in expenses).`);
      return;
    }

    case "checkSales": {
      const bounds = getRangeBounds(intent.period.rangeType, null, null);
      const sales = getFilteredSales(bounds);
      const report = computeSalesReport(sales);
      showVoiceAnswer(`Your sales ${intent.period.label} are ${formatNaira(report.totalSales)} from ${report.numberOfSales} transaction${report.numberOfSales === 1 ? "" : "s"}.`);
      return;
    }

    case "checkCustomerBalance": {
      const matches = findCustomerMatches(intent.name);
      if (matches.length === 0) {
        showVoiceAnswer(`I couldn't find a customer named "${intent.name}".`);
        return;
      }
      if (matches.length > 1) {
        showVoiceChoices(matches, (c) => c.name, (chosen) => {
          const stats = getCustomerStats(chosen.id);
          showVoiceAnswer(`${chosen.name} owes you ${formatNaira(stats.balance)}.`);
        });
        return;
      }
      const stats = getCustomerStats(matches[0].id);
      showVoiceAnswer(`${matches[0].name} owes you ${formatNaira(stats.balance)}.`);
      return;
    }

    case "checkReceivablesTotal": {
      const report = computeReceivablesReport();
      if (report.count === 0) {
        showVoiceAnswer("No customers currently owe you money.");
        return;
      }
      showVoiceAnswer(`${report.count} customer${report.count === 1 ? "" : "s"} owe${report.count === 1 ? "s" : ""} you a total of ${formatNaira(report.total)}.`);
      return;
    }

    case "checkSupplierBalance": {
      const matches = findSupplierMatches(intent.name);
      if (matches.length === 0) {
        showVoiceAnswer(`I couldn't find a supplier named "${intent.name}".`);
        return;
      }
      if (matches.length > 1) {
        showVoiceChoices(matches, (s) => s.name, (chosen) => {
          const stats = getSupplierStats(chosen.id);
          showVoiceAnswer(`You owe ${chosen.name} ${formatNaira(stats.owed)}.`);
        });
        return;
      }
      const stats = getSupplierStats(matches[0].id);
      showVoiceAnswer(`You owe ${matches[0].name} ${formatNaira(stats.owed)}.`);
      return;
    }

    case "checkPayablesTotal": {
      const report = computePayablesReport();
      if (report.count === 0) {
        showVoiceAnswer("You don't currently owe any suppliers.");
        return;
      }
      showVoiceAnswer(`You owe ${report.count} supplier${report.count === 1 ? "" : "s"} a total of ${formatNaira(report.total)}.`);
      return;
    }

    case "checkProductStock": {
      const matches = findProductMatches(intent.name);
      if (matches.length === 0) {
        showVoiceAnswer(`I couldn't find a product matching "${intent.name}".`);
        return;
      }
      if (matches.length > 1) {
        showVoiceChoices(matches, (p) => `${p.name} — ${p.quantity} in stock`, (chosen) => {
          showVoiceAnswer(`${chosen.name}: ${chosen.quantity} in stock, worth ${formatNaira((Number(chosen.quantity) || 0) * (Number(chosen.costPrice) || 0))}.`);
        });
        return;
      }
      const p = matches[0];
      showVoiceAnswer(`${p.name}: ${p.quantity} in stock, worth ${formatNaira((Number(p.quantity) || 0) * (Number(p.costPrice) || 0))}.`);
      return;
    }

    case "checkInventoryValue": {
      const products = loadInventory();
      showVoiceAnswer(`Your inventory is worth ${formatNaira(computeInventoryValue())} across ${products.length} product${products.length === 1 ? "" : "s"}.`);
      return;
    }

    case "clarify": {
      showVoiceError(intent.message, true);
      return;
    }

    case "addExpense": {
      routeAddExpense(intent, rawTranscript);
      return;
    }

    case "customerPayment": {
      routeCustomerPayment(intent, rawTranscript);
      return;
    }

    case "supplierPayment": {
      routeSupplierPayment(intent, rawTranscript);
      return;
    }

    case "newSale": {
      routeNewSale(intent, rawTranscript);
      return;
    }

    case "addStock": {
      routeAddStock(intent, rawTranscript);
      return;
    }

    default: {
      // Not one of Voice's own recognized commands — hand it to the AI
      // Business Assistant's (larger) read-only question set, which uses
      // the same shared NBA calculation engine. This only ever answers or
      // refuses read-only-style questions; it never performs an action.
      const aiResult = aiHandleQuestion(rawTranscript, { showInChat: true });
      if (aiResult.type === "answer" || aiResult.type === "refuse" || aiResult.type === "navigate") {
        showVoiceAnswer(aiResult.text);
        return;
      }
      showVoiceError('Sorry, I didn\'t understand that. Try things like "Open inventory", "How much did I sell today?", or "Add 5 bags of Rice at 5000 naira each."', true);
      return;
    }
  }
}

// ---- 12. Transaction command handlers (confirmation required before writing) ---

function routeAddStock(intent, rawTranscript) {
  const matches = findProductMatches(intent.productName);

  if (matches.length === 0) {
    showVoiceError(
      `I couldn't find "${titleCaseWords(intent.productName)}" in Inventory. Would you like to add it as a new product? Opening the New Product form for you — nothing has been saved yet.`,
      false
    );
    selectDashSection("inventory");
    openNewProductForm();
    productName.value = titleCaseWords(intent.productName);
    productQty.value = String(intent.qty);
    if (intent.unitPrice != null) productCost.value = String(intent.unitPrice);
    return;
  }

  if (matches.length > 1) {
    showVoiceChoices(matches, (p) => `${p.name} — ${p.quantity} in stock`, (chosen) => {
      confirmAddStock(chosen, intent);
    });
    return;
  }

  confirmAddStock(matches[0], intent);
}

function confirmAddStock(product, intent) {
  const unitCost = intent.unitPrice != null ? intent.unitPrice : (Number(product.costPrice) || 0);
  const total = intent.qty * unitCost;
  const rows = [
    ["Action", "Add stock"],
    ["Product", product.name],
    ["Quantity to add", String(intent.qty)],
    ["Cost", `${formatNaira(unitCost)} each`],
    ["Total (for reference)", formatNaira(total)]
  ];
  showVoiceConfirmation(rows, () => {
    addStockToProduct(product.id, intent.qty);
    renderInventorySummary();
    renderProductList();
    renderDashboard();
    showVoiceDone(`✓ Inventory updated. ${product.name} now has ${(Number(product.quantity) || 0) + intent.qty} in stock.`, true);
  });
}

function routeAddExpense(intent) {
  const category = voiceMatchExpenseCategory(intent.description);
  const method = voiceGuessPaymentMethod(intent.rawText, false);
  const rows = [
    ["Action", "Add expense"],
    ["Category", category],
    ["Description", category === "Other" ? intent.description : intent.description],
    ["Amount", formatNaira(intent.amount)],
    ["Payment method", `${method} (say "bank" in your command to change this)`]
  ];
  showVoiceConfirmation(rows, () => {
    addExpense({
      id: Date.now().toString(),
      expenseNumber: nextExpenseNumber(),
      date: todayDateValue(),
      category,
      description: intent.description,
      amount: intent.amount,
      paymentMethod: method,
      note: "Added via Voice Assistant",
      createdAt: new Date().toISOString()
    });
    renderExpensesTodaySummary();
    renderExpenseList();
    renderDashboard();
    showVoiceDone(`✓ Expense recorded: ${formatNaira(intent.amount)} for ${category}.`, true);
  });
}

function routeCustomerPayment(intent) {
  const matches = findCustomerMatches(intent.name);

  if (matches.length === 0) {
    showVoiceError(`I couldn't find a customer named "${titleCaseWords(intent.name)}". You can add them in the Customers section first.`, false);
    return;
  }
  if (matches.length > 1) {
    showVoiceChoices(matches, (c) => c.name, (chosen) => confirmCustomerPayment(chosen, intent));
    return;
  }
  confirmCustomerPayment(matches[0], intent);
}

function confirmCustomerPayment(customer, intent) {
  const stats = getCustomerStats(customer.id);
  if (stats.balance <= 0) {
    showVoiceError(`${customer.name} has no outstanding balance.`, false);
    return;
  }
  if (intent.amount > stats.balance) {
    showVoiceError(`That payment (${formatNaira(intent.amount)}) is more than ${customer.name}'s outstanding balance of ${formatNaira(stats.balance)}.`, false);
    return;
  }
  const method = voiceGuessPaymentMethod(intent.rawText, false);
  const rows = [
    ["Action", "Customer payment"],
    ["Customer", customer.name],
    ["Amount", formatNaira(intent.amount)],
    ["Payment method", `${method} (say "bank" in your command to change this)`],
    ["Balance after", formatNaira(stats.balance - intent.amount)]
  ];
  showVoiceConfirmation(rows, () => {
    addCustomerPayment({
      id: Date.now().toString(),
      customerId: customer.id,
      date: todayDateValue(),
      amount: intent.amount,
      paymentMethod: method,
      note: "Added via Voice Assistant",
      createdAt: new Date().toISOString()
    });
    renderDashboard();
    showVoiceDone(`✓ Customer payment recorded. ${customer.name}'s new balance is ${formatNaira(stats.balance - intent.amount)}.`, true);
  });
}

function routeSupplierPayment(intent) {
  const matches = findSupplierMatches(intent.name);

  if (matches.length === 0) {
    showVoiceError(`I couldn't find a supplier named "${titleCaseWords(intent.name)}". You can add them in the Suppliers section first.`, false);
    return;
  }
  if (matches.length > 1) {
    showVoiceChoices(matches, (s) => s.name, (chosen) => confirmSupplierPayment(chosen, intent));
    return;
  }
  confirmSupplierPayment(matches[0], intent);
}

function confirmSupplierPayment(supplier, intent) {
  const stats = getSupplierStats(supplier.id);
  if (stats.owed <= 0) {
    showVoiceError(`${supplier.name} has no outstanding balance.`, false);
    return;
  }
  if (intent.amount > stats.owed) {
    showVoiceError(`That payment (${formatNaira(intent.amount)}) is more than the ${formatNaira(stats.owed)} owed to ${supplier.name}.`, false);
    return;
  }
  const method = voiceGuessPaymentMethod(intent.rawText, false);
  const rows = [
    ["Action", "Supplier payment"],
    ["Supplier", supplier.name],
    ["Amount", formatNaira(intent.amount)],
    ["Payment method", `${method} (say "bank" in your command to change this)`],
    ["Balance after", formatNaira(stats.owed - intent.amount)]
  ];
  showVoiceConfirmation(rows, () => {
    addSupplierPayment({
      id: Date.now().toString(),
      supplierId: supplier.id,
      date: todayDateValue(),
      amount: intent.amount,
      paymentMethod: method,
      note: "Added via Voice Assistant",
      createdAt: new Date().toISOString()
    });
    renderDashboard();
    showVoiceDone(`✓ Supplier payment recorded. New balance owed to ${supplier.name} is ${formatNaira(stats.owed - intent.amount)}.`, true);
  });
}

function routeNewSale(intent) {
  const productMatches = findProductMatches(intent.productName);

  const proceedWithProduct = (product) => {
    if (intent.customerName) {
      const customerMatches = findCustomerMatches(intent.customerName);
      if (customerMatches.length === 0) {
        showVoiceError(`I couldn't find a customer named "${titleCaseWords(intent.customerName)}". You can add them in the Customers section first.`, false);
        return;
      }
      if (customerMatches.length > 1) {
        showVoiceChoices(customerMatches, (c) => c.name, (chosenCustomer) => {
          confirmNewSale(product, intent, chosenCustomer);
        });
        return;
      }
      confirmNewSale(product, intent, customerMatches[0]);
      return;
    }
    confirmNewSale(product, intent, null);
  };

  if (productMatches.length === 0) {
    // Not in Inventory — sold as a one-off custom item, exactly like the
    // Sales screen's own "Custom item" option. This never touches Inventory
    // or creates a new product.
    proceedWithProduct(null);
    return;
  }
  if (productMatches.length > 1) {
    showVoiceChoices(productMatches, (p) => `${p.name} — ${p.quantity} in stock`, (chosen) => proceedWithProduct(chosen));
    return;
  }
  proceedWithProduct(productMatches[0]);
}

function confirmNewSale(product, intent, customer) {
  const unitPrice = Math.round((intent.total / intent.qty) * 100) / 100;

  if (product && !customer) {
    const available = Number(product.quantity) || 0;
    if (intent.qty > available) {
      showVoiceError(`Only ${available} of "${product.name}" available in stock.`, false);
      return;
    }
  }

  const paymentType = customer ? "Credit" : "Paid";
  const method = customer ? null : voiceGuessPaymentMethod(intent.rawText, true);

  const rows = [
    ["Action", "New sale"],
    ["Item", product ? product.name : `${titleCaseWords(intent.productName)} (custom item)`],
    ["Quantity", String(intent.qty)],
    ["Price", `${formatNaira(unitPrice)} each`],
    ["Total", formatNaira(intent.total)]
  ];
  if (customer) {
    rows.push(["Customer", customer.name], ["Payment", "Credit (customer owes)"]);
  } else {
    rows.push(["Payment method", `${method} (say "bank" or "pos" in your command to change this)`]);
  }

  showVoiceConfirmation(rows, () => {
    if (product) {
      const available = Number(product.quantity) || 0;
      if (intent.qty > available) {
        showVoiceError(`Only ${available} of "${product.name}" available in stock.`, false);
        return;
      }
    }

    const sale = {
      id: Date.now().toString(),
      items: [{
        name: product ? product.name : titleCaseWords(intent.productName),
        qty: intent.qty,
        price: unitPrice,
        productId: product ? product.id : null,
        costPrice: product ? (Number(product.costPrice) || 0) : 0
      }],
      total: intent.total,
      paymentType,
      paymentMethod: paymentType === "Credit" ? null : method,
      customerId: customer ? customer.id : null,
      customerName: customer ? customer.name : null,
      createdAt: new Date().toISOString()
    };

    addSale(sale);
    renderSalesTodaySummary();
    renderSalesList();
    renderDashboard();
    showVoiceDone(`✓ Sale completed: ${formatNaira(intent.total)}.`, true);
  });
}

// ---- 14. AI Business Assistant V2 -------------------------------------------
//
// Architecture:
//   USER TEXT/VOICE -> askBusinessAssistant(question) -> question interpretation
//   -> EXISTING NBA data + the SAME shared calculation engine used by
//      Dashboard/Reports (computeSalesReport, computeExpensesReport,
//      getCustomerStats, getSupplierStats, computeInventoryReportData, etc.)
//   -> answer text.
//
// This module never writes to localStorage. It only reads, via the existing
// load*() functions and report/stat helpers defined earlier in this file.
// askBusinessAssistant() is the single abstraction point a future version
// could swap for a real AI model without touching the chat UI below it.

let aiConversationContext = { lastPeriod: null };

const AI_PERIOD_PHRASES = [
  [/\blast week\b/, "lastWeek", "last week"],
  [/\bthis week\b/, "thisWeek", "this week"],
  [/\blast month\b/, "lastMonth", "last month"],
  [/\bthis month\b/, "thisMonth", "this month"],
  [/\blast year\b/, "lastYear", "last year"],
  [/\bthis year\b/, "thisYear", "this year"],
  [/\byesterday\b/, "yesterday", "yesterday"],
  [/\btoday\b/, "today", "today"]
];

function aiExtractPeriodPhrase(norm) {
  for (let i = 0; i < AI_PERIOD_PHRASES.length; i++) {
    const [re, rangeType, label] = AI_PERIOD_PHRASES[i];
    if (re.test(norm)) return { rangeType, label };
  }
  return null;
}

// For period-based questions (sales, profit, expenses, purchases): if the
// question doesn't name a period, reuse the period from the previous
// question in this chat session (simple follow-up support, per spec —
// no long-term memory). Falls back to "today" if nothing has been asked yet.
function aiResolvePeriod(norm) {
  const explicit = aiExtractPeriodPhrase(norm);
  const period = explicit || aiConversationContext.lastPeriod || { rangeType: "today", label: "today" };
  aiConversationContext.lastPeriod = period;
  return period;
}

// Products/top-sellers are a different kind of question — default to
// all-time unless a period is explicitly named, and don't borrow the
// sales/profit follow-up period or leak this one back into it.
function aiResolveExplicitPeriodOrAllTime(norm) {
  return aiExtractPeriodPhrase(norm);
}

// ---- AI V2 Safe Actions -------------------------------------------------------
// Text actions prepare a transaction but NEVER execute it until the user
// explicitly confirms. Existing NBA transaction functions remain the source
// of truth for all financial effects.
let aiPendingAction = null;

function aiActionConfirmation(actionType, summary, data) {
  aiPendingAction = { actionType, summary, data };
  return { text: summary, type: "confirm", action: aiPendingAction };
}

function aiActionMethod(norm, allowPos) {
  if (allowPos && /\bpos\b/.test(norm)) return "POS";
  if (/\bbank\b|\btransfer\b/.test(norm)) return "Bank";
  return "Cash";
}

function aiPrepareAction(original) {
  const norm = String(original || "").toLowerCase().replace(/[?!.]+$/, "").trim();

  if (aiPendingAction && /^(yes|y|confirm|proceed|do it|go ahead)$/.test(norm)) {
    const action = aiPendingAction;
    aiPendingAction = null;
    return { text: aiExecutePendingAction(action), type: "executed" };
  }
  if (aiPendingAction && /^(no|n|cancel|stop)$/.test(norm)) {
    aiPendingAction = null;
    return { text: "Action cancelled. Nothing was changed.", type: "cancelled" };
  }
  if (aiPendingAction) {
    return { text: "Please confirm or cancel the current pending action first.", type: "clarify" };
  }

  // Sale: sell 2 rice cash / sell 2 rice credit to John
  let m = norm.match(/^(?:sell|record sale|make sale)\s+(\d+)\s+(.+)$/i);
  if (m) {
    const qty = Number(m[1]);
    let phrase = m[2].trim();
    let customerName = null;
    const customerMatch = phrase.match(/\s+to\s+(.+)$/i);
    if (customerMatch) {
      customerName = customerMatch[1].trim();
      phrase = phrase.slice(0, customerMatch.index).trim();
    }
    const paymentMatch = phrase.match(/\s+(cash|bank|transfer|pos|credit)$/i);
    let paymentWord = paymentMatch ? paymentMatch[1].toLowerCase() : "";
    if (paymentMatch) phrase = phrase.slice(0, paymentMatch.index).trim();
    if (!qty || !phrase) return { text: "Please provide a quantity and product name.", type: "clarify" };

    const products = findProductMatches(phrase);
    if (!products.length) return { text: `I couldn't find a product matching "${phrase}" in Inventory.`, type: "clarify" };
    if (products.length > 1) return { text: `I found multiple products matching "${phrase}". Please use a more specific product name.`, type: "clarify" };
    const product = products[0];
    if (qty > (Number(product.quantity) || 0)) return { text: `Only ${Number(product.quantity) || 0} of "${product.name}" is in stock.`, type: "clarify" };

    let customer = null;
    if (customerName) {
      const customers = findCustomerMatches(customerName);
      if (!customers.length) return { text: `I couldn't find a customer named "${customerName}".`, type: "clarify" };
      if (customers.length > 1) return { text: `I found multiple customers matching "${customerName}". Please be more specific.`, type: "clarify" };
      customer = customers[0];
    }

    const credit = paymentWord === "credit" || !!customer;
    if (credit && !customer) return { text: "Credit sales need a customer. Try: Sell 2 rice credit to John.", type: "clarify" };
    const method = credit ? null : aiActionMethod(paymentWord, true);
    const price = Number(product.sellingPrice) || 0;
    const total = price * qty;
    const sale = {
      id: Date.now().toString(),
      items: [{ name: product.name, qty, price, productId: product.id, costPrice: Number(product.costPrice) || 0 }],
      total,
      paymentType: credit ? "Credit" : "Paid",
      paymentMethod: method,
      customerId: customer ? customer.id : null,
      customerName: customer ? customer.name : null,
      createdAt: new Date().toISOString()
    };
    return aiActionConfirmation("sale", `Create sale\n${qty} × ${product.name} @ ${formatNaira(price)}\nTotal: ${formatNaira(total)}\n${customer ? `Customer: ${customer.name} · Credit` : `Payment: ${method}`}`, sale);
  }

  // Purchase: buy 10 bags of rice at 12000 each / purchase 5 bottles of water from ABC Wholesalers on credit
  m = norm.match(/^(?:buy|purchase)\s+(\d+)\s+(.+)$/i);
  if (m) {
    const qty = Number(m[1]);
    let phrase = m[2].trim();

    const creditFlag = /\bon credit\b/i.test(phrase);
    phrase = phrase.replace(/\s*\bon credit\b/i, "").trim();

    // Extract cost BEFORE supplier — "from <supplier>" is greedy to the end
    // of the string, so it must run after "at <price> each" is pulled out.
    let costPrice = null;
    const atMatch = phrase.match(/\s+at\s+([\d,.]+)\s*(?:each)?\s*$/i);
    if (atMatch) {
      costPrice = Number(atMatch[1].replace(/,/g, ""));
      phrase = phrase.slice(0, atMatch.index).trim();
    }

    let supplierName = null;
    const supMatch = phrase.match(/\s+from\s+(.+)$/i);
    if (supMatch) {
      supplierName = supMatch[1].trim();
      phrase = phrase.slice(0, supMatch.index).trim();
    }

    phrase = phrase.replace(/^(?:bags?|units?|pieces?|packs?|cartons?|bottles?|crates?|kegs?)\s+of\s+/i, "").replace(/^of\s+/i, "").trim();

    if (!qty || !phrase) return { text: "Please provide a quantity and product name for the purchase.", type: "clarify" };

    const products = findProductMatches(phrase);
    if (!products.length) return { text: `I couldn't find a product matching "${phrase}" in Inventory.`, type: "clarify" };
    if (products.length > 1) return { text: `I found multiple products matching "${phrase}". Please use a more specific product name.`, type: "clarify" };
    const product = products[0];

    let supplier = null;
    const suppliers = loadSuppliers();
    if (supplierName) {
      const supplierMatches = findSupplierMatches(supplierName);
      if (!supplierMatches.length) return { text: `I couldn't find a supplier named "${supplierName}".`, type: "clarify" };
      if (supplierMatches.length > 1) return { text: `I found multiple suppliers matching "${supplierName}". Please be more specific.`, type: "clarify" };
      supplier = supplierMatches[0];
    } else if (suppliers.length === 1) {
      supplier = suppliers[0];
    } else if (suppliers.length === 0) {
      return { text: "You need to add a supplier before I can record a purchase. Try: Add supplier <name>.", type: "clarify" };
    } else {
      return { text: "Which supplier is this purchase from? Try: Buy 10 bags of rice from <supplier>.", type: "clarify" };
    }

    const usedExistingCost = costPrice == null;
    const cost = usedExistingCost ? (Number(product.costPrice) || 0) : costPrice;
    if (!(cost >= 0)) return { text: "Cost price must be zero or more.", type: "clarify" };

    const method = creditFlag ? "Credit" : (/\bbank\b|\btransfer\b/i.test(norm) ? "Bank" : "Cash");
    const total = qty * cost;
    const purchaseNumber = "PUR-" + String(loadPurchases().length + 1).padStart(4, "0");
    const purchase = {
      id: Date.now().toString(),
      purchaseNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: [{ productId: product.id, name: product.name, qty, costPrice: cost }],
      total,
      paymentMethod: method,
      notes: "Added via AI Business Assistant V2",
      createdAt: new Date().toISOString()
    };

    return aiActionConfirmation(
      "purchase",
      `Create purchase\nSupplier: ${supplier.name}\n${qty} × ${product.name} @ ${formatNaira(cost)}${usedExistingCost ? " (current cost price)" : ""}\nTotal: ${formatNaira(total)}\nPayment: ${method}${method === "Credit" ? " (supplier balance will increase)" : ""}`,
      purchase
    );
  }

  // Expense: record 5000 transport expense / add expense 5000 electricity bank
  m = norm.match(/^(?:record|add)\s+(?:expense\s+)?(?:₦|ngn|naira)?\s*([\d,.]+)\s+(.+)$/i);
  if (m && /expense|transport|rent|electricity|fuel|salary|internet|data|water|maintenance|food|other/.test(m[2])) {
    const amount = Number(m[1].replace(/,/g, ""));
    let description = m[2].replace(/\b(expense|cash|bank|transfer)\b/gi, "").trim();
    if (!(amount > 0)) return { text: "Expense amount must be greater than zero.", type: "clarify" };
    const category = voiceMatchExpenseCategory(description);
    const method = /\bbank\b|\btransfer\b/i.test(m[2]) ? "Bank" : "Cash";
    const expense = { id: Date.now().toString(), expenseNumber: nextExpenseNumber(), date: todayDateValue(), category, description, amount, paymentMethod: method, note: "Added via AI Business Assistant V2", createdAt: new Date().toISOString() };
    return aiActionConfirmation("expense", `Record expense\nCategory: ${category}\nAmount: ${formatNaira(amount)}\nPayment: ${method}`, expense);
  }

  // Customer payment: receive 5000 from John / record customer payment 5000 from John
  // / record 10000 customer payment from John by bank
  m = norm.match(/^(?:receive|record customer payment)\s+(?:₦|ngn|naira)?\s*([\d,.]+)\s+from\s+(.+?)(?:\s+(?:by\s+)?(cash|bank|transfer))?$/i);
  if (!m) m = norm.match(/^record\s+(?:₦|ngn|naira)?\s*([\d,.]+)\s+customer payment\s+from\s+(.+?)(?:\s+(?:by\s+)?(cash|bank|transfer))?$/i);
  if (m) {
    const amount = Number(m[1].replace(/,/g, ""));
    const customerName = m[2].trim();
    const customers = findCustomerMatches(customerName);
    if (!customers.length) return { text: `I couldn't find a customer named "${customerName}".`, type: "clarify" };
    if (customers.length > 1) return { text: `I found multiple customers matching "${customerName}". Please be more specific.`, type: "clarify" };
    const customer = customers[0], stats = getCustomerStats(customer.id);
    if (!(amount > 0)) return { text: "Payment amount must be greater than zero.", type: "clarify" };
    if (stats.balance <= 0) return { text: `${customer.name} has no outstanding balance.`, type: "clarify" };
    if (amount > stats.balance) return { text: `That exceeds ${customer.name}'s outstanding balance of ${formatNaira(stats.balance)}.`, type: "clarify" };
    const method = aiActionMethod(m[3] || "", false);
    const payment = { id: Date.now().toString(), customerId: customer.id, date: todayDateValue(), amount, paymentMethod: method, note: "Added via AI Business Assistant V2", createdAt: new Date().toISOString() };
    return aiActionConfirmation("customerPayment", `Record customer payment\nCustomer: ${customer.name}\nAmount: ${formatNaira(amount)}\nPayment: ${method}\nBalance after: ${formatNaira(stats.balance - amount)}`, payment);
  }

  // Customer payment alternate: John paid 5000 bank / John paid me 5000 cash
  m = norm.match(/^(.+?)\s+paid\s+(?:me\s+)?(?:₦|ngn|naira)?\s*([\d,.]+)(?:\s+(?:by\s+)?(cash|bank|transfer))?$/i);
  if (m) {
    const customerName = m[1].trim();
    const amount = Number(m[2].replace(/,/g, ""));
    const customers = findCustomerMatches(customerName);
    if (!customers.length) return { text: `I couldn't find a customer named "${customerName}".`, type: "clarify" };
    if (customers.length > 1) return { text: `I found multiple customers matching "${customerName}". Please be more specific.`, type: "clarify" };
    const customer = customers[0], stats = getCustomerStats(customer.id);
    if (!(amount > 0)) return { text: "Payment amount must be greater than zero.", type: "clarify" };
    if (stats.balance <= 0) return { text: `${customer.name} has no outstanding balance.`, type: "clarify" };
    if (amount > stats.balance) return { text: `That exceeds ${customer.name}'s outstanding balance of ${formatNaira(stats.balance)}.`, type: "clarify" };
    const method = aiActionMethod(m[3] || "", false);
    const payment = { id: Date.now().toString(), customerId: customer.id, date: todayDateValue(), amount, paymentMethod: method, note: "Added via AI Business Assistant V2", createdAt: new Date().toISOString() };
    return aiActionConfirmation("customerPayment", `Record customer payment\nCustomer: ${customer.name}\nAmount: ${formatNaira(amount)}\nPayment: ${method}\nBalance after: ${formatNaira(stats.balance - amount)}`, payment);
  }

  // Supplier payment: pay ABC 10000 bank / pay supplier ABC 30000 by bank
  m = norm.match(/^pay\s+(?:supplier\s+)?(.+?)\s+(?:₦|ngn|naira)?\s*([\d,.]+)(?:\s+(?:by\s+)?(cash|bank|transfer))?$/i);
  if (m) {
    const supplierName = m[1].trim();
    const amount = Number(m[2].replace(/,/g, ""));
    const suppliers = findSupplierMatches(supplierName);
    if (!suppliers.length) return { text: `I couldn't find a supplier named "${supplierName}".`, type: "clarify" };
    if (suppliers.length > 1) return { text: `I found multiple suppliers matching "${supplierName}". Please be more specific.`, type: "clarify" };
    const supplier = suppliers[0], stats = getSupplierStats(supplier.id);
    if (!(amount > 0)) return { text: "Payment amount must be greater than zero.", type: "clarify" };
    if (stats.owed <= 0) return { text: `${supplier.name} has no outstanding balance.`, type: "clarify" };
    if (amount > stats.owed) return { text: `That exceeds the ${formatNaira(stats.owed)} owed to ${supplier.name}.`, type: "clarify" };
    const method = aiActionMethod(m[3] || "", false);
    const payment = { id: Date.now().toString(), supplierId: supplier.id, date: todayDateValue(), amount, paymentMethod: method, note: "Added via AI Business Assistant V2", createdAt: new Date().toISOString() };
    return aiActionConfirmation("supplierPayment", `Record supplier payment\nSupplier: ${supplier.name}\nAmount: ${formatNaira(amount)}\nPayment: ${method}\nBalance after: ${formatNaira(stats.owed - amount)}`, payment);
  }

  // Drawing: I took 10000 cash for personal use / record a drawing of 5000
  m = norm.match(/^i\s+took\s+(?:₦|ngn|naira)?\s*([\d,.]+)\s*(cash|bank|transfer)?\s*(?:for\s+(.+))?$/i);
  if (!m) m = norm.match(/^(?:record|add)\s+(?:a\s+)?drawing\s+(?:of\s+)?(?:₦|ngn|naira)?\s*([\d,.]+)(?:\s+(?:by\s+)?(cash|bank|transfer))?(?:\s+for\s+(.+))?$/i);
  if (m) {
    const amount = Number(m[1].replace(/,/g, ""));
    if (!(amount > 0)) return { text: "Drawing amount must be greater than zero.", type: "clarify" };
    const method = aiActionMethod(m[2] || "", false);
    const reasonPhrase = (m[3] || "").trim();

    let reason = "Personal use";
    let description = "";
    const rq = reasonPhrase.toLowerCase();
    if (/family/.test(rq)) reason = "Family";
    else if (/bill/.test(rq)) reason = "Personal bill";
    else if (/purchase/.test(rq)) reason = "Personal purchase";
    else if (!rq || /personal use|personal|myself/.test(rq)) reason = "Personal use";
    else { reason = "Other"; description = titleCaseWords(reasonPhrase); }

    // A drawing can never push Cash or Bank negative — same rule the manual
    // Drawings form enforces via availableBalanceForDrawing().
    const available = availableBalanceForDrawing(method, null);
    if (amount > available) {
      return { text: `Insufficient ${method.toLowerCase()} balance for this drawing. Available: ${formatNaira(available)}.`, type: "clarify" };
    }

    const drawing = {
      id: Date.now().toString(),
      drawingNumber: nextDrawingNumber(),
      date: todayDateValue(),
      reason,
      description,
      amount,
      paymentMethod: method,
      note: "Added via AI Business Assistant V2",
      createdAt: new Date().toISOString()
    };

    return aiActionConfirmation(
      "drawing",
      `Record drawing\nReason: ${reason}${description ? " — " + description : ""}\nAmount: ${formatNaira(amount)}\nPayment: ${method}\nBalance after: ${formatNaira(available - amount)}`,
      drawing
    );
  }

  // Money transfer: transfer 20000 from cash to bank / move 5000 from bank to cash
  m = norm.match(/^(?:transfer|move)\s+(?:₦|ngn|naira)?\s*([\d,.]+)\s+(?:from\s+)?(cash|bank)\s+to\s+(cash|bank)\b(?:\s+for\s+(.+))?$/i);
  if (m) {
    const amount = Number(m[1].replace(/,/g, ""));
    const fromAccount = m[2].toLowerCase() === "cash" ? "Cash" : "Bank";
    const toAccount = m[3].toLowerCase() === "cash" ? "Cash" : "Bank";
    const note = (m[4] || "").trim();

    if (fromAccount === toAccount) {
      return { text: "Choose two different accounts — for example: Transfer 20000 from cash to bank.", type: "clarify" };
    }
    if (!(amount > 0)) return { text: "Transfer amount must be greater than zero.", type: "clarify" };

    const business = loadBusiness();
    const fromBalance = fromAccount === "Cash" ? (Number(business && business.cash) || 0) : (Number(business && business.bank) || 0);
    if (amount > fromBalance) {
      return { text: `Insufficient ${fromAccount.toLowerCase()} balance. Available: ${formatNaira(fromBalance)}.`, type: "clarify" };
    }

    const data = { fromAccount, toAccount, amount, note, date: todayDateValue() };
    return aiActionConfirmation(
      "moneyTransfer",
      `Confirm Transfer\nFrom: ${fromAccount}\nTo: ${toAccount}\nAmount: ${formatNaira(amount)}${note ? `\nNote: ${note}` : ""}`,
      data
    );
  }

  // Reverse stock adjustment: reverse my last stock adjustment / undo the stock adjustment for rice
  m = norm.match(/^(?:reverse|undo)\s+(?:my\s+)?(?:last\s+)?(?:the\s+)?stock adjustment(?:\s+for\s+(.+))?$/i);
  if (m) {
    const adjustments = loadInventoryAdjustments().filter((a) => !a.reversed && a.type !== "reversal");
    let target = null;
    if (m[1]) {
      const products = findProductMatches(m[1].trim());
      if (!products.length) return { text: `I couldn't find a product matching "${m[1].trim()}".`, type: "clarify" };
      const productAdjustments = adjustments.filter((a) => a.productId === products[0].id);
      if (!productAdjustments.length) return { text: `There's no unreversed stock adjustment for ${products[0].name}.`, type: "clarify" };
      target = productAdjustments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    } else {
      if (!adjustments.length) return { text: "There's no stock adjustment to reverse.", type: "clarify" };
      target = adjustments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    }
    return aiActionConfirmation(
      "reverseStockAdjustment",
      `Reverse stock adjustment ${target.adjustmentNumber}\nProduct: ${target.productName}\nOriginal change: ${target.qtyChange > 0 ? "+" : ""}${target.qtyChange} units\nThis will restore ${target.productName} to ${target.previousQty} units.`,
      { adjustmentId: target.id }
    );
  }

  // Create customer / supplier
  m = norm.match(/^(?:create|add) customer\s+(.+?)(?:\s+(\d{7,15}))?$/i);
  if (m) {
    const data = { id: Date.now().toString(), name: m[1].trim(), phone: m[2] || "", email: "", address: "", notes: "Added via AI Business Assistant V2", createdAt: new Date().toISOString() };
    return aiActionConfirmation("createCustomer", `Create customer\nName: ${data.name}\nPhone: ${data.phone || "N/A"}`, data);
  }

  m = norm.match(/^(?:create|add) supplier\s+(.+)$/i);
  if (m) {
    const data = { id: Date.now().toString(), name: m[1].trim(), phone: "", email: "", address: "", notes: "Added via AI Business Assistant V2", createdAt: new Date().toISOString() };
    return aiActionConfirmation("createSupplier", `Create supplier\nName: ${data.name}`, data);
  }

  return null;
}

function aiExecutePendingAction(action) {
  try {
    switch (action.actionType) {
      case "sale": addSale(action.data); break;
      case "purchase": addPurchase(action.data); break;
      case "expense": addExpense(action.data); break;
      case "drawing": addDrawing(action.data); break;
      case "customerPayment": addCustomerPayment(action.data); break;
      case "supplierPayment": addSupplierPayment(action.data); break;
      case "createCustomer": addCustomer(action.data); break;
      case "createSupplier": addSupplier(action.data); break;
      case "moneyTransfer": {
        const result = createMoneyTransfer(action.data);
        if (!result.ok) return result.error;
        break;
      }
      case "reverseStockAdjustment": {
        const result = reverseStockAdjustment(action.data.adjustmentId);
        if (!result.ok) return result.error;
        break;
      }
      default: return "That action is not supported yet.";
    }
    if (typeof renderSalesTodaySummary === "function") renderSalesTodaySummary();
    if (typeof renderSalesList === "function") renderSalesList();
    if (typeof renderPurchasesTodaySummary === "function") renderPurchasesTodaySummary();
    if (typeof renderPurchaseList === "function") renderPurchaseList();
    if (typeof renderInventorySummary === "function") renderInventorySummary();
    if (typeof renderProductList === "function") renderProductList();
    if (typeof renderStockAdjustmentsList === "function") renderStockAdjustmentsList();
    if (typeof renderExpensesTodaySummary === "function") renderExpensesTodaySummary();
    if (typeof renderExpenseList === "function") renderExpenseList();
    if (typeof renderDrawingsTodaySummary === "function") renderDrawingsTodaySummary();
    if (typeof renderDrawingsStatGrid === "function") renderDrawingsStatGrid();
    if (typeof renderDrawingList === "function") renderDrawingList();
    if (typeof renderTransfersStatGrid === "function") renderTransfersStatGrid();
    if (typeof renderTransferList === "function") renderTransferList();
    if (typeof renderCustomersSummary === "function") renderCustomersSummary();
    if (typeof renderCustomerList === "function") renderCustomerList();
    if (typeof renderSuppliersSummary === "function") renderSuppliersSummary();
    if (typeof renderSupplierList === "function") renderSupplierList();
    if (typeof renderDashboard === "function") renderDashboard();
    if (typeof renderReports === "function") renderReports();
    return "✓ Action executed successfully. Your NBA records and balances have been updated.";
  } catch (e) {
    console.error("NBA AI V2 action failed", e);
    return "I couldn't complete that action. Please check the relevant NBA section.";
  }
}

// ---- Navigation ------------------------------------------------------------------

const AI_NAV_MAP = [
  [/^(open|go to|show|navigate to)\s+inventory\b/, "inventory", "Inventory"],
  [/^(open|go to|show|navigate to)\s+reports?\b/, "reports", "Reports"],
  [/^(open|go to|show|navigate to)\s+customers?\b/, "customers", "Customers"],
  [/^(open|go to|show|navigate to)\s+suppliers?\b/, "suppliers", "Suppliers"],
  [/^(open|go to|show|navigate to)\s+backup\b/, "settings", "Backup & Restore"],
  [/^(open|go to|show|navigate to)\s+settings\b/, "settings", "Settings"],
  [/^(open|go to|show|navigate to)\s+alerts\b/, "alerts", "Alerts"],
  [/^(open|go to|show|navigate to)\s+sales\b/, "sales", "Sales"],
  [/^(open|go to|show|navigate to)\s+purchases\b/, "purchases", "Purchases"],
  [/^(open|go to|show|navigate to)\s+expenses\b/, "expenses", "Expenses"],
  [/^(open|go to|show|navigate to)\s+drawings\b/, "drawings", "Drawings"],
  [/^(open|go to|show|navigate to)\s+transfers?\b/, "transfers", "Transfers"],
  [/^(open|go to|show|navigate to)\s+dashboard\b/, "dashboard", "Dashboard"]
];

// ---- Main entry point --------------------------------------------------------

function askBusinessAssistant(rawQuestion) {
  const original = (rawQuestion || "").trim();
  if (!original) {
    return { text: "Please type a question — for example, \"How much did I sell today?\"", type: "clarify" };
  }

  const norm = original.toLowerCase().replace(/[?!.]+$/, "").trim();

  // 1. V2 safe actions: prepare only; explicit confirmation is required before execution.
  const actionResult = aiPrepareAction(original);
  if (actionResult) return actionResult;

  // 2. Navigation.
  for (let i = 0; i < AI_NAV_MAP.length; i++) {
    const [re, section, label] = AI_NAV_MAP[i];
    if (re.test(norm)) {
      selectDashSection(section);
      return { text: `✓ Opened ${label}.`, type: "navigate" };
    }
  }

  // 3. Business summary.
  if (/business summary|summary of my business|business overview|give me a summary/.test(norm)) {
    return { text: aiBuildBusinessSummary(), type: "answer" };
  }

  // 4. Profit.
  if (/\bprofit\b/.test(norm)) {
    return { text: aiAnswerProfit(norm), type: "answer" };
  }

  // 5. Sales.
  if (/\b(sold|sales|sell)\b/.test(norm)) {
    return { text: aiAnswerSales(norm), type: "answer" };
  }

  // 6. Expenses.
  if (/\bexpense/.test(norm) || /how much did i spend\b(?!.*purchase)/.test(norm)) {
    return { text: aiAnswerExpenses(norm), type: "answer" };
  }

  // 7. Inventory — best-selling / top products.
  if (/best.selling|top.selling|top products/.test(norm)) {
    return { text: aiAnswerTopProducts(norm), type: "answer" };
  }

  // 8. Inventory — low stock.
  if (/low (in )?stock|low.stock|running low/.test(norm)) {
    return { text: aiAnswerLowStock(), type: "answer" };
  }

  // 8b. Cash / bank balance — checked before the generic product-quantity
  // pattern below, since "how much cash/bank do I have" would otherwise be
  // misread as a request for a product literally named "cash".
  if (/how much cash do i have|my cash balance|cash balance\b/.test(norm)) {
    return { text: aiAnswerCashBalance(), type: "answer" };
  }
  if (/bank balance\b|how much (?:is|do i have) in (?:the )?bank/.test(norm)) {
    return { text: aiAnswerBankBalance(), type: "answer" };
  }

  // 8d. Money transfers / stock adjustments — read-only history questions.
  if (/money transfers?\b|show.*transfers?\b|transfer history/.test(norm)) {
    return { text: aiAnswerMoneyTransfers(), type: "answer" };
  }
  if (/stock adjustments?\b|inventory adjustments?\b/.test(norm)) {
    return { text: aiAnswerStockAdjustments(), type: "answer" };
  }

  // 8c. Inventory — specific product quantity ("How much rice do I have?").
  m = norm.match(/how (?:much|many) (.+?) do i have\b/);
  if (!m) m = norm.match(/how much (.+?) (?:is|are) left\b/);
  if (!m) m = norm.match(/check inventory (?:of|for)\s+(.+)$/);
  if (m) return { text: aiAnswerProductStock(m[1].trim()), type: "answer" };

  // 9. Inventory — value / quantity.
  if (/inventory|stock\b/.test(norm)) {
    return { text: aiAnswerInventory(norm), type: "answer" };
  }

  // 10. Customers / receivables.
  let m = norm.match(/how much does (.+?) owe me/);
  if (m) return { text: aiAnswerCustomerBalance(m[1].trim()), type: "answer" };
  if (/who owes me the most/.test(norm)) return { text: aiAnswerTopReceivable(), type: "answer" };
  if (/who owes me( money)?\b|customers? owing\b|\breceivables\b|do customers owe/.test(norm)) {
    return { text: aiAnswerReceivablesTotal(), type: "answer" };
  }

  // 11. Suppliers / payables.
  m = norm.match(/how much do i owe (.+)/);
  if (m) {
    const who = m[1].trim();
    if (/^suppliers?$|^my suppliers?$/.test(who)) return { text: aiAnswerPayablesTotal(), type: "answer" };
    return { text: aiAnswerSupplierBalance(who), type: "answer" };
  }
  if (/which supplier do i owe the most/.test(norm)) return { text: aiAnswerTopPayable(), type: "answer" };
  if (/who do i owe\b|\bpayables\b/.test(norm)) return { text: aiAnswerPayablesTotal(), type: "answer" };

  // 12. Purchases.
  if (/purchase/.test(norm) || /bought\b|buy\b/.test(norm)) {
    return { text: aiAnswerPurchases(norm), type: "answer" };
  }

  // 13. Unknown.
  return {
    text: "I'm not sure what you mean. Try asking about sales, profit, expenses, inventory, customers, suppliers, purchases, or reports.",
    type: "unknown"
  };
}

// ---- Answer builders (all read the SAME data + functions as Dashboard/Reports) --

function aiBuildBusinessSummary() {
  const business = loadBusiness();
  if (!business) return "I don't have enough data in NBA to answer that.";

  const bounds = getRangeBounds("today", null, null);
  const sales = getFilteredSales(bounds);
  const expenses = getFilteredExpenses(bounds);
  const salesReport = computeSalesReport(sales);
  const grossProfit = sales.reduce((sum, s) => sum + computeSaleProfit(s), 0);
  const expensesReport = computeExpensesReport(expenses);
  const netProfit = grossProfit - expensesReport.total;

  const lines = [
    "Business Summary (today)",
    "",
    `Sales: ${formatNaira(salesReport.totalSales)}`,
    `Gross Profit: ${formatNaira(grossProfit)}`,
    `Expenses: ${formatNaira(expensesReport.total)}`,
    `Net Profit: ${formatNaira(netProfit)}`,
    `Customers Owe: ${formatNaira(computeTotalReceivables())}`,
    `Supplier Payables: ${formatNaira(computeTotalPayables())}`,
    `Inventory Value: ${formatNaira(computeInventoryValue())}`
  ];
  return lines.join("\n");
}

function aiAnswerProfit(norm) {
  const period = aiResolvePeriod(norm);
  const bounds = getRangeBounds(period.rangeType, null, null);
  const sales = getFilteredSales(bounds);
  const expenses = getFilteredExpenses(bounds);
  const grossProfit = sales.reduce((sum, s) => sum + computeSaleProfit(s), 0);
  const expensesTotal = computeExpensesReport(expenses).total;

  if (/\bgross profit\b/.test(norm) && !/\bnet profit\b/.test(norm)) {
    return `Your gross profit ${period.label} is ${formatNaira(grossProfit)}.`;
  }

  const netProfit = grossProfit - expensesTotal;
  if (sales.length === 0 && expenses.length === 0) {
    return `You have no sales or expenses recorded ${period.label}, so profit is ${formatNaira(0)}.`;
  }
  return `Your net profit ${period.label} is ${formatNaira(netProfit)} (${formatNaira(grossProfit)} gross profit minus ${formatNaira(expensesTotal)} in expenses).`;
}

function aiAnswerSales(norm) {
  const period = aiResolvePeriod(norm);
  const bounds = getRangeBounds(period.rangeType, null, null);
  const sales = getFilteredSales(bounds);
  const report = computeSalesReport(sales);

  if (report.numberOfSales === 0) {
    return `You haven't recorded any sales ${period.label}.`;
  }

  if (/how many/.test(norm)) {
    return `You made ${report.numberOfSales} sale${report.numberOfSales === 1 ? "" : "s"} ${period.label}, totaling ${formatNaira(report.totalSales)}.`;
  }

  if (/payment method|which method/.test(norm)) {
    const byMethod = [
      ["Cash", report.cash],
      ["Bank Transfer", report.bank],
      ["POS", report.pos],
      ["Credit", report.credit]
    ].sort((a, b) => b[1] - a[1]);
    if (byMethod[0][1] === 0) return `No sales have been recorded ${period.label} yet.`;
    return `${byMethod[0][0]} brought in the most sales ${period.label}, with ${formatNaira(byMethod[0][1])}.`;
  }

  return `You made ${formatNaira(report.totalSales)} in sales ${period.label} from ${report.numberOfSales} transaction${report.numberOfSales === 1 ? "" : "s"}.`;
}

function aiAnswerExpenses(norm) {
  const period = aiResolvePeriod(norm);
  const bounds = getRangeBounds(period.rangeType, null, null);
  const expenses = getFilteredExpenses(bounds);
  const report = computeExpensesReport(expenses);

  if (expenses.length === 0) {
    return `You haven't recorded any expenses ${period.label}.`;
  }

  if (/category|which .* cost/.test(norm)) {
    const entries = Object.entries(report.byCategory).sort((a, b) => b[1] - a[1]);
    return `Your highest expense category ${period.label} is ${entries[0][0]}, at ${formatNaira(entries[0][1])}.`;
  }

  return `You spent ${formatNaira(report.total)} on expenses ${period.label}.`;
}

function aiAnswerTopProducts(norm) {
  const period = aiResolveExplicitPeriodOrAllTime(norm);
  const bounds = period ? getRangeBounds(period.rangeType, null, null) : null;
  const sales = getFilteredSales(bounds);
  const top = computeTopProductsReport(sales, 5);
  if (top.length === 0) {
    return `I don't have enough sales data ${period ? period.label : "yet"} to work that out.`;
  }
  const label = period ? ` ${period.label}` : " overall";
  const list = top.map((p, i) => `${i + 1}. ${p.name} — ${p.qty} sold (${formatNaira(p.value)})`).join("\n");
  return `Your top-selling products${label}:\n${list}`;
}

function aiAnswerLowStock() {
  const data = computeInventoryReportData();
  if (data.lowStock.length === 0) {
    return "All your products are sufficiently stocked.";
  }
  const list = data.lowStock.slice(0, 8).map((p) => `- ${p.name}: ${p.quantity} left`).join("\n");
  return `These products are low in stock:\n${list}`;
}

function aiAnswerInventory(norm) {
  const data = computeInventoryReportData();
  if (data.totalProducts === 0) {
    return "You haven't added any products to Inventory yet.";
  }
  if (/worth|value/.test(norm)) {
    return `Your inventory is worth ${formatNaira(data.stockValue)} across ${data.totalProducts} product${data.totalProducts === 1 ? "" : "s"}.`;
  }
  return `You have ${data.totalUnits} unit${data.totalUnits === 1 ? "" : "s"} across ${data.totalProducts} product${data.totalProducts === 1 ? "" : "s"}, worth ${formatNaira(data.stockValue)}.`;
}

function aiAnswerProductStock(name) {
  const matches = findProductMatches(name);
  if (matches.length === 0) {
    return `I couldn't find a product matching "${titleCaseWords(name)}".`;
  }
  if (matches.length > 1) {
    const list = matches.map((p) => `- ${p.name}: ${p.quantity} in stock`).join("\n");
    return `I found more than one match:\n${list}`;
  }
  const p = matches[0];
  const qty = Number(p.quantity) || 0;
  return `You have ${qty} unit${qty === 1 ? "" : "s"} of ${p.name} in stock, worth ${formatNaira(qty * (Number(p.costPrice) || 0))}.`;
}

function aiAnswerCashBalance() {
  const business = loadBusiness();
  const cash = Number(business && business.cash) || 0;
  return `Your current cash balance is ${formatNaira(cash)}.`;
}

function aiAnswerBankBalance() {
  const business = loadBusiness();
  const bank = Number(business && business.bank) || 0;
  return `Your current bank balance is ${formatNaira(bank)}.`;
}

function aiAnswerMoneyTransfers() {
  const transfers = sortTransfersForDisplay(loadMoneyTransfers());
  if (transfers.length === 0) return "You haven't recorded any money transfers yet.";
  const list = transfers.slice(0, 8).map((t) => {
    const status = t.reversed ? " (reversed)" : "";
    return `- ${t.transferNumber}: ${formatNaira(t.amount)} from ${t.fromAccount} to ${t.toAccount}, ${formatExpenseDate(t.date)}${status}`;
  }).join("\n");
  return `Your recent money transfers:\n${list}`;
}

function aiAnswerStockAdjustments() {
  const adjustments = sortAdjustmentsForDisplay(loadInventoryAdjustments());
  if (adjustments.length === 0) return "You haven't recorded any stock adjustments yet.";
  const list = adjustments.slice(0, 8).map((a) => {
    const sign = a.qtyChange > 0 ? "+" : "";
    const status = a.reversed ? " (reversed)" : "";
    return `- ${a.adjustmentNumber}: ${a.productName} ${sign}${a.qtyChange} units, ${formatExpenseDate(a.date)}${status}`;
  }).join("\n");
  return `Your recent stock adjustments:\n${list}`;
}

function aiAnswerCustomerBalance(name) {
  const matches = findCustomerMatches(name);
  if (matches.length === 0) {
    return `I couldn't find a customer named "${titleCaseWords(name)}".`;
  }
  if (matches.length > 1) {
    const list = matches.map((c) => `- ${c.name}: ${formatNaira(getCustomerStats(c.id).balance)}`).join("\n");
    return `I found more than one match:\n${list}`;
  }
  const stats = getCustomerStats(matches[0].id);
  return `${matches[0].name} owes you ${formatNaira(stats.balance)}.`;
}

function aiAnswerReceivablesTotal() {
  const report = computeReceivablesReport();
  if (report.count === 0) return "No customers currently owe you money.";
  return `Your customers currently owe you ${formatNaira(report.total)} in total, across ${report.count} customer${report.count === 1 ? "" : "s"}.`;
}

function aiAnswerTopReceivable() {
  const report = computeReceivablesReport();
  if (report.count === 0) return "No customers currently owe you money.";
  const top = report.rows[0];
  return `${top.name} owes you the most: ${formatNaira(top.balance)}.`;
}

function aiAnswerSupplierBalance(name) {
  const matches = findSupplierMatches(name);
  if (matches.length === 0) {
    return `I couldn't find a supplier named "${titleCaseWords(name)}".`;
  }
  if (matches.length > 1) {
    const list = matches.map((s) => `- ${s.name}: ${formatNaira(getSupplierStats(s.id).owed)}`).join("\n");
    return `I found more than one match:\n${list}`;
  }
  const stats = getSupplierStats(matches[0].id);
  return `You owe ${matches[0].name} ${formatNaira(stats.owed)}.`;
}

function aiAnswerPayablesTotal() {
  const report = computePayablesReport();
  if (report.count === 0) return "You don't currently owe any suppliers.";
  return `You owe ${report.count} supplier${report.count === 1 ? "" : "s"} a total of ${formatNaira(report.total)}.`;
}

function aiAnswerTopPayable() {
  const report = computePayablesReport();
  if (report.count === 0) return "You don't currently owe any suppliers.";
  const top = report.rows[0];
  return `You owe ${top.name} the most: ${formatNaira(top.owed)}.`;
}

function aiAnswerPurchases(norm) {
  const period = aiResolvePeriod(norm);
  const bounds = getRangeBounds(period.rangeType, null, null);
  const purchases = getFilteredPurchases(bounds);
  const report = computePurchasesReport(purchases);

  if (purchases.length === 0) {
    return `You haven't recorded any purchases ${period.label}.`;
  }

  if (/how many/.test(norm)) {
    return `You made ${report.numberOfPurchases} purchase${report.numberOfPurchases === 1 ? "" : "s"} ${period.label}, totaling ${formatNaira(report.totalPurchases)}.`;
  }

  if (/which supplier|most from/.test(norm)) {
    const bySupplier = {};
    purchases.forEach((p) => {
      const name = p.supplierName || "Unknown supplier";
      bySupplier[name] = (bySupplier[name] || 0) + (Number(p.total) || 0);
    });
    const top = Object.entries(bySupplier).sort((a, b) => b[1] - a[1])[0];
    return `You bought the most from ${top[0]} ${period.label}, spending ${formatNaira(top[1])}.`;
  }

  return `You spent ${formatNaira(report.totalPurchases)} on purchases ${period.label} from ${report.numberOfPurchases} purchase${report.numberOfPurchases === 1 ? "" : "s"}.`;
}

// ---- Chat UI ---------------------------------------------------------------------

function aiAppendMessage(sender, text, extraClass) {
  if (!aiChatLog) return;
  const wrap = document.createElement("div");
  wrap.className = "ai-msg " + (sender === "user" ? "ai-msg-user" : "ai-msg-bot") + (extraClass ? " " + extraClass : "");

  const senderEl = document.createElement("span");
  senderEl.className = "ai-msg-sender";
  senderEl.textContent = sender === "user" ? "You" : "NBA AI";
  wrap.appendChild(senderEl);

  const bubble = document.createElement("div");
  bubble.className = "ai-msg-bubble";
  bubble.textContent = text;
  wrap.appendChild(bubble);

  aiChatLog.appendChild(wrap);
  aiChatLog.scrollTop = aiChatLog.scrollHeight;
}

// Single shared entry point for text AND voice — this is the abstraction
// layer a future real AI model would plug into instead of askBusinessAssistant().
function aiAppendActionConfirmation(result) {
  if (!aiChatLog || !result || !result.action) return;
  const wrap = document.createElement("div");
  wrap.className = "ai-msg ai-msg-bot ai-action-message";
  const senderEl = document.createElement("span");
  senderEl.className = "ai-msg-sender";
  senderEl.textContent = "NBA AI";
  wrap.appendChild(senderEl);

  const bubble = document.createElement("div");
  bubble.className = "ai-msg-bubble";
  bubble.textContent = "Please review this action before anything is changed:";

  const card = document.createElement("div");
  card.className = "ai-confirm-card";
  const summary = document.createElement("div");
  summary.className = "ai-confirm-summary";
  summary.textContent = result.action.summary;
  card.appendChild(summary);

  const actions = document.createElement("div");
  actions.className = "ai-confirm-actions";
  const yes = document.createElement("button");
  yes.type = "button";
  yes.className = "btn-primary btn-compact";
  yes.textContent = "YES, PROCEED";
  const no = document.createElement("button");
  no.type = "button";
  no.className = "btn-secondary btn-compact";
  no.textContent = "CANCEL";

  yes.addEventListener("click", () => {
    if (!aiPendingAction) return;
    const action = aiPendingAction;
    aiPendingAction = null;
    yes.disabled = true; no.disabled = true;
    aiAppendMessage("bot", aiExecutePendingAction(action));
  });
  no.addEventListener("click", () => {
    if (!aiPendingAction) return;
    aiPendingAction = null;
    yes.disabled = true; no.disabled = true;
    aiAppendMessage("bot", "Action cancelled. Nothing was changed.");
  });

  actions.appendChild(yes);
  actions.appendChild(no);
  card.appendChild(actions);
  bubble.appendChild(card);
  wrap.appendChild(bubble);
  aiChatLog.appendChild(wrap);
  aiChatLog.scrollTop = aiChatLog.scrollHeight;
}

function aiHandleQuestion(questionText, opts) {
  const showInChat = !opts || opts.showInChat !== false;
  if (showInChat) aiAppendMessage("user", questionText);
  let result;
  try {
    result = askBusinessAssistant(questionText);
  } catch (e) {
    console.error("NBA AI error", e);
    result = { text: "I couldn't process that right now. Please try again.", type: "error" };
  }
  if (showInChat) {
    if (result.type === "confirm") aiAppendActionConfirmation(result);
    else aiAppendMessage("bot", result.text, result.type === "refuse" ? "ai-msg-refuse" : "");
  }
  return result;
}

if (aiChatForm) {
  aiChatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = aiChatInput.value.trim();
    if (!question) return;
    aiChatInput.value = "";
    aiHandleQuestion(question);
  });
}

if (aiSuggestions) {
  aiSuggestions.addEventListener("click", (event) => {
    const btn = event.target.closest(".ai-suggestion-btn");
    if (!btn) return;
    aiHandleQuestion(btn.dataset.q);
  });
}

// ---- 13. Initial fab state on script load ----------------------------------------

updateVoiceFabVisibility();
// ---- 10. On page load: restore a previously created business ------------------

function startNBAApp() {
  const existing = loadBusiness();
  if (existing) {
    fillFormFromData(existing);
    showDashboard();
  } else {
    updatePreview();
    showFormView();
  }
}

// ---- 11. Account System V1 — Firebase Authentication ---------------------------
// This section is additive: it does not touch any of the business logic above.
// It only decides WHEN startNBAApp() runs, and shows a Login / Create Account /
// Forgot Password screen when nobody is signed in yet.

// ---- 11a. Central auth state ----
// Firebase UID is the permanent identity key for NBA's data going forward.
let currentNBAUser = null;

// ---- 11b. DOM references ----
const authLoadingView = document.getElementById("authLoadingView");
const authView = document.getElementById("authView");

const loginPanel = document.getElementById("loginPanel");
const createAccountPanel = document.getElementById("createAccountPanel");
const forgotPasswordPanel = document.getElementById("forgotPasswordPanel");

const loginForm = document.getElementById("loginForm");
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginFormError = document.getElementById("loginFormError");

const createAccountForm = document.getElementById("createAccountForm");
const createFullNameInput = document.getElementById("createFullName");
const createEmailInput = document.getElementById("createEmail");
const createPasswordInput = document.getElementById("createPassword");
const createConfirmPasswordInput = document.getElementById("createConfirmPassword");
const createAccountBtn = document.getElementById("createAccountBtn");
const createAccountFormError = document.getElementById("createAccountFormError");

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotEmailInput = document.getElementById("forgotEmail");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const forgotPasswordFormError = document.getElementById("forgotPasswordFormError");
const forgotPasswordSuccess = document.getElementById("forgotPasswordSuccess");

const showForgotPasswordBtn = document.getElementById("showForgotPasswordBtn");
const showCreateAccountBtn = document.getElementById("showCreateAccountBtn");
const backToLoginFromCreateBtn = document.getElementById("backToLoginFromCreateBtn");
const backToLoginFromForgotBtn = document.getElementById("backToLoginFromForgotBtn");

const topbarAccount = document.getElementById("topbarAccount");
const accountNameEl = document.getElementById("accountName");
const accountEmailEl = document.getElementById("accountEmail");
const logoutBtn = document.getElementById("logoutBtn");

// ---- 11c. Small helpers: field errors + form-level error banners ----

function setAuthFieldError(inputEl, errorElId, message) {
  const errorEl = document.getElementById(errorElId);
  const wrapper = inputEl.closest(".field");
  if (message) {
    wrapper.classList.add("has-error");
    errorEl.textContent = message;
    inputEl.setAttribute("aria-invalid", "true");
  } else {
    wrapper.classList.remove("has-error");
    errorEl.textContent = "";
    inputEl.removeAttribute("aria-invalid");
  }
}

function showAuthFormError(bannerEl, message) {
  bannerEl.textContent = message;
  bannerEl.hidden = false;
}

function hideAuthFormError(bannerEl) {
  bannerEl.hidden = true;
  bannerEl.textContent = "";
}

function clearAuthPanelState(panelPrefix) {
  // Wipes error banners + field errors for a panel without touching the
  // other two panels' state.
  if (panelPrefix === "login") {
    hideAuthFormError(loginFormError);
    setAuthFieldError(loginEmailInput, "err-loginEmail", null);
    setAuthFieldError(loginPasswordInput, "err-loginPassword", null);
  } else if (panelPrefix === "create") {
    hideAuthFormError(createAccountFormError);
    setAuthFieldError(createFullNameInput, "err-createFullName", null);
    setAuthFieldError(createEmailInput, "err-createEmail", null);
    setAuthFieldError(createPasswordInput, "err-createPassword", null);
    setAuthFieldError(createConfirmPasswordInput, "err-createConfirmPassword", null);
  } else if (panelPrefix === "forgot") {
    hideAuthFormError(forgotPasswordFormError);
    forgotPasswordSuccess.hidden = true;
    setAuthFieldError(forgotEmailInput, "err-forgotEmail", null);
  }
}

// ---- 11d. Panel switching (Login / Create Account / Forgot Password) ----

function showLoginPanel() {
  loginPanel.hidden = false;
  createAccountPanel.hidden = true;
  forgotPasswordPanel.hidden = true;
  clearAuthPanelState("create");
  clearAuthPanelState("forgot");
}

function showCreateAccountPanel() {
  loginPanel.hidden = true;
  createAccountPanel.hidden = false;
  forgotPasswordPanel.hidden = true;
  clearAuthPanelState("login");
  clearAuthPanelState("forgot");
}

function showForgotPasswordPanelFn() {
  loginPanel.hidden = true;
  createAccountPanel.hidden = true;
  forgotPasswordPanel.hidden = false;
  clearAuthPanelState("login");
  clearAuthPanelState("create");
}

showForgotPasswordBtn.addEventListener("click", showForgotPasswordPanelFn);
showCreateAccountBtn.addEventListener("click", showCreateAccountPanel);
backToLoginFromCreateBtn.addEventListener("click", showLoginPanel);
backToLoginFromForgotBtn.addEventListener("click", showLoginPanel);

// ---- 11e. Friendly error messages ----
// Firebase's raw error objects/codes should never reach the user directly.

function mapFirebaseAuthError(error) {
  const code = (error && error.code) || "";
  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "The email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 6 characters).";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// ---- 11f. Account badge (small, non-dominant area in the top bar) ----

function renderAccountBadge(user) {
  if (!user) {
    topbarAccount.hidden = true;
    return;
  }
  accountNameEl.textContent = user.displayName || "Account";
  accountEmailEl.textContent = user.email || "";
  topbarAccount.hidden = false;
}

// ---- 11g. Login ----

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearAuthPanelState("login");

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  let hasError = false;
  if (!email || !isValidEmail(email)) {
    setAuthFieldError(loginEmailInput, "err-loginEmail", "Enter a valid email address.");
    hasError = true;
  }
  if (!password) {
    setAuthFieldError(loginPasswordInput, "err-loginPassword", "Enter your password.");
    hasError = true;
  }
  if (hasError) return;

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in…";

  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch((error) => {
      showAuthFormError(loginFormError, mapFirebaseAuthError(error));
    })
    .finally(() => {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    });
});

// ---- 11h. Create Account ----

createAccountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearAuthPanelState("create");

  const fullName = createFullNameInput.value.trim();
  const email = createEmailInput.value.trim();
  const password = createPasswordInput.value;
  const confirmPassword = createConfirmPasswordInput.value;

  let hasError = false;
  if (!fullName) {
    setAuthFieldError(createFullNameInput, "err-createFullName", "Enter your full name.");
    hasError = true;
  }
  if (!email || !isValidEmail(email)) {
    setAuthFieldError(createEmailInput, "err-createEmail", "Enter a valid email address.");
    hasError = true;
  }
  if (!password || password.length < 6) {
    setAuthFieldError(createPasswordInput, "err-createPassword", "Password must be at least 6 characters.");
    hasError = true;
  }
  if (confirmPassword !== password) {
    setAuthFieldError(createConfirmPasswordInput, "err-createConfirmPassword", "Passwords do not match.");
    hasError = true;
  }
  if (hasError) return;

  createAccountBtn.disabled = true;
  createAccountBtn.textContent = "Creating account…";

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((credential) => credential.user.updateProfile({ displayName: fullName }))
    .then(() => {
      // Keep the badge in sync — updateProfile resolves slightly after
      // onAuthStateChanged first fires, so refresh it here too.
      renderAccountBadge(firebase.auth().currentUser);
    })
    .catch((error) => {
      showAuthFormError(createAccountFormError, mapFirebaseAuthError(error));
    })
    .finally(() => {
      createAccountBtn.disabled = false;
      createAccountBtn.textContent = "Create Account";
    });
});

// ---- 11i. Forgot Password ----

forgotPasswordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearAuthPanelState("forgot");

  const email = forgotEmailInput.value.trim();
  if (!email || !isValidEmail(email)) {
    setAuthFieldError(forgotEmailInput, "err-forgotEmail", "Enter a valid email address.");
    return;
  }

  forgotPasswordBtn.disabled = true;
  forgotPasswordBtn.textContent = "Sending…";

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      forgotPasswordSuccess.textContent = "Reset email sent. Check your inbox for a link to set a new password.";
      forgotPasswordSuccess.hidden = false;
    })
    .catch((error) => {
      showAuthFormError(forgotPasswordFormError, mapFirebaseAuthError(error));
    })
    .finally(() => {
      forgotPasswordBtn.disabled = false;
      forgotPasswordBtn.textContent = "Send Reset Email";
    });
});

// ---- 11j. Logout ----
// Signing out does NOT touch localStorage — existing business data stays put.

logoutBtn.addEventListener("click", () => {
  firebase.auth().signOut();
});

// ---- 11k. Startup: Firebase is the source of truth for auth state ----
// Do NOT decide login state from localStorage — only Firebase's own session
// observer decides whether NBA or the Login screen is shown.

function showAuthConfigError(message) {
  authLoadingView.innerHTML =
    '<p style="max-width:360px;text-align:center;">' + message + "</p>";
  authLoadingView.hidden = false;
  authView.hidden = true;
  setupView.hidden = true;
  dashboardView.hidden = true;
}

if (typeof firebase === "undefined" || window.__nbaFirebaseInitError) {
  // FAILURE RULE: never show a blank page — show a clear, fixable message.
  showAuthConfigError(
    "NBA couldn't connect to the login system. Check firebase-config.js and your internet connection, then reload."
  );
} else {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      currentNBAUser = user;
      renderAccountBadge(user);
      authView.hidden = true;
      showLoginPanel(); // reset the auth screen underneath, ready for next logout

      // NBA V2 — resolve cloud state BEFORE rendering. For an established
      // cloud account this pulls the latest data into localStorage first, so
      // startNBAApp() (unchanged, still just reads localStorage) shows
      // current data instead of a stale/empty local copy. See section 12.
      await initCloudSync();

      authLoadingView.hidden = true;
      startNBAApp();
    } else {
      currentNBAUser = null;
      cloudSyncEnabled = false;
      setSyncStatus("idle");
      migrationOfferBanner.hidden = true;
      migrationConflictBanner.hidden = true;
      renderAccountBadge(null);
      authLoadingView.hidden = true;
      setupView.hidden = true;
      dashboardView.hidden = true;
      authView.hidden = false;
      showLoginPanel();
    }
  }, (error) => {
    showAuthConfigError("There was a problem checking your login session. Please reload the page.");
  });
}

// ---- 12. NBA V2 — Cloud Sync (Firestore) ----------------------------------
// Design decisions, and why:
//
// 1. Every existing save*()/load*() function is used by hundreds of call
//    sites across the business engine, ALL of them synchronous. Firestore
//    reads/writes are asynchronous. Rewriting every call site to use
//    promises/await would mean rewriting the business engine — explicitly
//    forbidden. So instead: save*() functions still write to localStorage
//    synchronously and unchanged; a Firestore write is fired in the
//    background afterwards (non-blocking, "fire-and-forget"). Nothing that
//    calls save*() needs to know Firestore exists.
//
// 2. Rather than inventing a new per-record Firestore schema (one doc per
//    sale, per expense, etc.), this mirrors the ALREADY-AUTHORITATIVE
//    NBA_BACKUP_KEYS / collectBackupData() used by Backup & Restore (Module
//    8q, above). Firestore stores the exact same snapshot shape as a backup
//    JSON file, in ONE document per business. This guarantees the cloud
//    copy can never drift from what NBA actually persists (nothing here is
//    a separate/guessed schema), keeps Firestore reads/writes to one
//    document per sync (cheap), and means restoring a backup and syncing to
//    the cloud use the same, already-tested data shape.
//    Known limitation: Firestore documents cap at 1 MiB. For a small/medium
//    business's history in JSON this is very unlikely to be reached soon,
//    but a business with very many years of transactions could eventually
//    need a per-collection schema instead. Flagging this now rather than
//    letting it surface silently later.
//
// 3. Firestore's own offline persistence (IndexedDB-based) is NOT enabled
//    here. NBA already has a more reliable offline layer — localStorage,
//    which every module already reads/writes synchronously — and
//    IndexedDB support is inconsistent across embedded WebViews like
//    KSWEB's. Rather than layering a second, less-tested offline mechanism
//    on top, cloud sync treats localStorage as the offline cache it already
//    was, and Firestore purely as a background mirror.

// ---- 12a. DOM references ----

const syncIndicatorEl = document.getElementById("syncIndicator");
const migrationOfferBanner = document.getElementById("migrationOfferBanner");
const migrationUploadBtn = document.getElementById("migrationUploadBtn");
const migrationSkipBtn = document.getElementById("migrationSkipBtn");
const migrationStatusText = document.getElementById("migrationStatusText");
const migrationConflictBanner = document.getElementById("migrationConflictBanner");
const conflictUseCloudBtn = document.getElementById("conflictUseCloudBtn");
const conflictUseLocalBtn = document.getElementById("conflictUseLocalBtn");
const conflictStatusText = document.getElementById("conflictStatusText");

// ---- 12b. Cloud sync state ----

let cloudSyncEnabled = false; // true once this session has a confirmed, resolved relationship with Firestore
let cloudSyncStatus = "idle"; // idle | syncing | synced | offline | error

// Business ID: NBA V1's architecture supports exactly one business per
// signed-in user (no business switcher exists anywhere in the current UI),
// so the Firebase UID doubles as the business document ID. This keeps
// ownership trivial to check in security rules (see firestore.rules) and
// avoids inventing a separate ID scheme the app has no concept of yet.

function getBusinessDocRef() {
  return db.collection("businesses").doc(currentNBAUser.uid);
}

// ---- 12c. Sync status indicator (small, next to the account badge) ----

function setSyncStatus(status) {
  cloudSyncStatus = status;
  if (!syncIndicatorEl) return;
  const labels = {
    idle: "",
    syncing: "Syncing…",
    synced: "Synced",
    offline: "Offline — will sync",
    error: "Sync failed"
  };
  const text = labels[status] || "";
  syncIndicatorEl.textContent = text;
  syncIndicatorEl.className = "sync-indicator sync-" + status;
  syncIndicatorEl.hidden = !text;
}

// ---- 12d. Push: whole-business snapshot up to Firestore ----
// Fire-and-forget by design (see note 1 above) — callers never await this.

function pushBusinessSnapshotToCloud() {
  if (!cloudSyncEnabled || !currentNBAUser || !db) return;
  setSyncStatus("syncing");
  const business = loadBusiness();
  getBusinessDocRef().set({
    ownerUid: currentNBAUser.uid,
    businessName: (business && business.businessName) || "",
    data: collectBackupData(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true })
    .then(() => setSyncStatus("synced"))
    .catch((err) => {
      console.error("Cloud sync failed:", err);
      setSyncStatus(navigator.onLine ? "error" : "offline");
    });
}

// ---- 12e. Pull: apply a cloud snapshot to localStorage ----
// Mirrors performRestore()'s field-by-field write (Module 8q, above) exactly,
// so a cloud pull is exactly as safe as a manual backup restore already is.
// Deliberately NOT calling performRestore() itself, to avoid touching its
// confirm-modal/UI-specific code paths for what is here an automatic,
// no-confirmation "hydrate this device" operation.

function applyCloudDataToLocalStorage(data) {
  if (!data || typeof data !== "object") return;
  Object.entries(NBA_BACKUP_KEYS).forEach(([field, key]) => {
    const value = data[field];
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else if (typeof value === "number") {
      localStorage.setItem(key, String(value));
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
  cachedSettings = null; // invalidate — settings were just written directly, bypassing saveSettings()
}

async function pullBusinessSnapshotFromCloud() {
  setSyncStatus("syncing");
  const snap = await getBusinessDocRef().get();
  if (snap.exists && snap.data().data) {
    applyCloudDataToLocalStorage(snap.data().data);
  }
  setSyncStatus("synced");
}

// ---- 12f. Migration: one-time upload of this device's local data ----
// Awaited and explicit (unlike the background push above) because this is a
// deliberate, user-confirmed action with its own success/failure UI.

async function migrateLocalDataToCloud() {
  if (!currentNBAUser || !db) return { ok: false, error: "Cloud isn't available right now." };
  setSyncStatus("syncing");
  try {
    const business = loadBusiness();
    await getBusinessDocRef().set({
      ownerUid: currentNBAUser.uid,
      businessName: (business && business.businessName) || "",
      data: collectBackupData(),
      migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }); // full overwrite, not merge — this is the one-time authoritative first upload
    cloudSyncEnabled = true;
    setSyncStatus("synced");
    return { ok: true };
  } catch (err) {
    console.error("Migration failed:", err);
    setSyncStatus("error");
    return { ok: false, error: err.message || "Something went wrong during upload." };
  }
}

// ---- 12g. Small helper: don't let a slow/dead connection hang forever ----
// Nigeria-relevant: mobile connections can stall without ever erroring.

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
  ]);
}

// ---- 12h. Resolve cloud state on login, BEFORE the app renders ----
// Called once from onAuthStateChanged, awaited there before startNBAApp().

async function initCloudSync() {
  cloudSyncEnabled = false;
  setSyncStatus("idle");

  if (typeof db === "undefined" || !db) {
    // Firestore SDK/config unavailable — NBA still runs fully on local data.
    console.warn("Firestore not available — NBA is running in local-only mode.");
    return;
  }

  let snap;
  try {
    snap = await withTimeout(getBusinessDocRef().get(), 8000);
  } catch (err) {
    console.error("Could not reach Firestore:", err);
    setSyncStatus(navigator.onLine ? "error" : "offline");
    return; // NBA continues fully functional on whatever's already local
  }

  const localBusiness = loadBusiness();
  const cloudExists = snap.exists;
  const cloudData = cloudExists ? snap.data() : null;
  const cloudMigrated = !!(cloudData && cloudData.migratedAt);

  if (cloudExists && cloudMigrated) {
    // Established cloud account (the common ongoing case) — hydrate local
    // storage from the cloud copy before the app renders, so the dashboard
    // never shows stale/empty local data on a second device.
    try {
      await pullBusinessSnapshotFromCloud();
      cloudSyncEnabled = true;
    } catch (err) {
      console.error("Cloud pull failed:", err);
      setSyncStatus(navigator.onLine ? "error" : "offline");
      // Fall through: NBA opens with whatever's already in localStorage.
    }
  } else if (cloudExists && !cloudMigrated && localBusiness) {
    // Ambiguous: this device has local data AND the cloud has an
    // unconfirmed/partial record. Per the brief — stop and let the person
    // decide, don't guess. The app still opens normally on local data
    // underneath while this banner waits for a decision.
    migrationConflictBanner.hidden = false;
    setSyncStatus("idle");
  } else if (!cloudExists && localBusiness) {
    // Normal first-time case: local business, nothing uploaded yet.
    migrationOfferBanner.hidden = false;
    setSyncStatus("idle");
  } else if (cloudExists && !localBusiness) {
    // New device logging into an existing cloud account.
    try {
      await pullBusinessSnapshotFromCloud();
      cloudSyncEnabled = true;
    } catch (err) {
      console.error("Cloud pull failed:", err);
      setSyncStatus(navigator.onLine ? "error" : "offline");
    }
  } else {
    // Brand new account, no data anywhere yet — nothing to reconcile.
    cloudSyncEnabled = true;
  }
}

// ---- 12i. Wrap every save*() (+ performRestore) so it also syncs to the cloud ----
// The originals above are completely untouched — this only intercepts the
// function *reference* each name points to. Defensive: if a name doesn't
// exist for any reason, it's silently skipped rather than breaking startup.

function wrapWithCloudSync(fnName) {
  const original = window[fnName];
  if (typeof original !== "function") return;
  window[fnName] = function (...args) {
    const result = original.apply(this, args);
    pushBusinessSnapshotToCloud();
    return result;
  };
}

[
  "saveBusiness", "saveSettings", "saveSales", "saveInventory", "saveSuppliers",
  "savePurchases", "saveSupplierPayments", "saveExpenses", "saveDrawings",
  "saveInventoryAdjustments", "saveMoneyTransfers", "saveCustomers",
  "saveCustomerPayments", "saveReceiptNumbers"
].forEach(wrapWithCloudSync);

// ---- 12j. Migration banner — "Upload to Cloud" / "Not Now" ----

migrationUploadBtn.addEventListener("click", async () => {
  migrationUploadBtn.disabled = true;
  migrationSkipBtn.disabled = true;
  migrationStatusText.hidden = false;
  migrationStatusText.textContent = "Uploading…";

  const result = await migrateLocalDataToCloud();

  if (result.ok) {
    migrationStatusText.textContent = "✓ Uploaded. Your data is now backed up to the cloud.";
    setTimeout(() => { migrationOfferBanner.hidden = true; }, 2500);
  } else {
    migrationStatusText.textContent =
      "Upload failed: " + result.error + " Your local data is untouched — you can try again anytime.";
    migrationUploadBtn.disabled = false;
    migrationSkipBtn.disabled = false;
  }
});

migrationSkipBtn.addEventListener("click", () => {
  migrationOfferBanner.hidden = true;
  // Not remembered as a permanent dismissal — unsynced business data is a
  // real risk worth resurfacing next login rather than silently forgetting.
});

// ---- 12k. Conflict banner — "Use Cloud Data" / "Use This Device's Data" ----
// Per the brief: STOP and let the person choose; never auto-resolve.

conflictUseCloudBtn.addEventListener("click", async () => {
  conflictUseCloudBtn.disabled = true;
  conflictUseLocalBtn.disabled = true;
  conflictStatusText.hidden = false;
  conflictStatusText.textContent = "Loading cloud data…";

  try {
    await pullBusinessSnapshotFromCloud();
    await getBusinessDocRef().set(
      { migratedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    cloudSyncEnabled = true;
    conflictStatusText.textContent = "✓ Cloud data loaded. Reloading…";
    setTimeout(() => window.location.reload(), 1200);
  } catch (err) {
    conflictStatusText.textContent =
      "Couldn't load cloud data: " + (err.message || "unknown error") + ". Nothing was changed — try again anytime.";
    conflictUseCloudBtn.disabled = false;
    conflictUseLocalBtn.disabled = false;
  }
});

conflictUseLocalBtn.addEventListener("click", async () => {
  conflictUseCloudBtn.disabled = true;
  conflictUseLocalBtn.disabled = true;
  conflictStatusText.hidden = false;
  conflictStatusText.textContent = "Uploading this device's data…";

  const result = await migrateLocalDataToCloud();

  if (result.ok) {
    conflictStatusText.textContent = "✓ This device's data is now the cloud copy.";
    setTimeout(() => { migrationConflictBanner.hidden = true; }, 2000);
  } else {
    conflictStatusText.textContent = "Failed: " + result.error + " Nothing was changed — try again anytime.";
    conflictUseCloudBtn.disabled = false;
    conflictUseLocalBtn.disabled = false;
  }
});
