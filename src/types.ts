export type UserType = 'freelancer' | 'student' | 'traveler' | 'business';

export interface UserProfile {
  name: string;
  email: string;
  userType: UserType;
  primaryCurrency: string;
  country: string;
}

export interface Wallet {
  id: string;
  currency: string;
  symbol: string;
  balance: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: 'Income' | 'Utilities' | 'Dining' | 'Software' | 'Travel' | 'Exchange' | 'Education' | 'Gear';
  amount: number;
  type: 'income' | 'expense';
  currency: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: 'paid' | 'pending' | 'overdue';
  currency: string;
  taxRate: number;
}

export interface FlowCard {
  id: string;
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  cardType: 'virtual' | 'physical';
  limit: number;
  spent: number;
  currency: string;
  isFrozen: boolean;
  selectedTemplate: 'obsidian' | 'aurora' | 'cyberGold' | 'hologram';
  // Step 8 parameters
  cardBrand?: 'visa' | 'mastercard';
  spendingLimit?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  onlinePaymentsEnabled?: boolean;
  internationalPaymentsEnabled?: boolean;
  atmWithdrawalsEnabled?: boolean;
  maskedNumber?: string;
  deliveryStatus?: 'requested' | 'processing' | 'shipped' | 'delivered' | 'activated';
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRequest {
  id: string;
  requester_user_id: string;
  receiver_user_id: string;
  wallet_id: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'MAD';
  note: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Enriched fields
  requesterName?: string;
  receiverName?: string;
  role?: 'requester' | 'receiver';
}

export interface QRPayment {
  id: string;
  creator_user_id: string;
  wallet_id: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'MAD';
  qr_token: string;
  status: 'pending' | 'success' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface SplitBillParticipant {
  id: string;
  split_bill_id: string;
  user_id: string;
  amount_due: number;
  amount_paid: number;
  status: 'pending' | 'paid';
  userName?: string;
}

export interface SplitBill {
  id: string;
  creator_user_id: string;
  title: string;
  total_amount: number;
  currency: 'USD' | 'EUR' | 'MAD';
  status: 'pending' | 'partially_paid' | 'completed' | 'cancelled';
  created_at: string;
  // Enriched fields
  creatorName?: string;
  participants: SplitBillParticipant[];
  amountDue?: number;
  amountPaid?: number;
  myPaymentStatus?: 'pending' | 'paid' | 'not_involved';
  paidPool?: number;
  remainingAmount?: number;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  time: string;
  read: boolean;
  type: string;
  createdAt: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestions?: string[];
  groundingLinks?: { label: string; url: string }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  category: 'AUTH' | 'WALLET' | 'TRANSACTION' | 'CARD' | 'SECURITY' | 'KYC' | 'ADMIN' | 'SUPPORT';
  details: string;
  ipAddress: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SecuritySession {
  id: string;
  userId: string;
  deviceModel: string;
  ipAddress: string;
  location: string;
  isActive: boolean;
  lastActive: string;
  isTrusted: boolean;
}

export interface KycSubmission {
  id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  selfieUrl: string;
  submittedAt: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  notes: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'pending' | 'resolved' | 'closed' | 'escalated';
  createdAt: string;
  messages: {
    id: string;
    sender: 'user' | 'agent' | 'ai';
    text: string;
    timestamp: string;
  }[];
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  currency: string;
}

export type SavingsGoalType = 'travel' | 'emergency_fund' | 'rent' | 'electronics' | 'vehicle' | 'education' | 'custom';
export type SavingsGoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string;
  goalType: SavingsGoalType;
  status: SavingsGoalStatus;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'paused' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  merchantName: string;
  amount: number;
  currency: string;
  renewalFrequency: 'monthly' | 'weekly' | 'custom';
  nextRenewalDate: string;
  status: SubscriptionStatus;
  createdAt: string;
}

export type InsightType = 'budget_warning' | 'subscription_alert' | 'spending_trend' | 'low_balance' | 'saving_suggestion' | 'unusual_activity' | 'cashflow_alert';

export interface Insight {
  id: string;
  userId: string;
  insightType: InsightType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  relatedEntityId?: string;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalSpent: string;
  totalReceived: string;
  netCashflow: string;
  topCategory: string;
  savingsRate: string;
}

export interface MonthlyReport {
  month: string;
  inflowAggregateUSD: number;
  outflowAggregateUSD: number;
  efficientSavingsCoefficient: number;
  complianceStatement: string;
  summaryText: string;
}

export interface SearchResult {
  query: string;
  result: {
    amount: string;
    currency: string;
    transactionCount: number;
    matchingTransactions: Transaction[];
  };
}

export interface FraudEvent {
  id: string;
  userId: string;
  eventType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  resolved: boolean;
  createdAt: string;
}

export interface SecurityOverview {
  riskScore: 'low' | 'medium' | 'high' | 'critical';
  riskScoreValue: number;
  trustedDevices: number;
  activeSessions: number;
  recentAlerts: number;
  biometricsActive: boolean;
  twoFactorActive: boolean;
}



