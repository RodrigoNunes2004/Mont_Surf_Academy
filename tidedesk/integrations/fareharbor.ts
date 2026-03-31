/**
 * FareHarbor External API v1 client.
 * Docs: https://fareharbor.com/api/external/v1/
 *
 * Auth: X-FareHarbor-API-App + X-FareHarbor-API-User headers.
 * The "app key" is the platform partner key (env FAREHARBOR_APP_KEY).
 * The "user key" is per-business (stored encrypted in Integration.config).
 */

const BASE_URL = "https://fareharbor.com/api/external/v1";

// ── Types ──────────────────────────────────────────────────────────

export type FHCompany = {
  shortname: string;
  name: string;
  currency: string;
  about: string;
};

export type FHItem = {
  pk: number;
  name: string;
  headline: string;
  description: string;
  cancellation_policy: string;
  location: { address: { city: string; province: string; country: string } } | null;
  image_cdn_url: string | null;
};

export type FHAvailability = {
  pk: number;
  start_at: string; // ISO 8601
  end_at: string;
  capacity: number;
  minimum_party_size: number;
  maximum_party_size: number;
  item: { pk: number };
  customer_type_rates: FHCustomerTypeRate[];
};

export type FHCustomerTypeRate = {
  pk: number;
  total: number; // cents
  capacity: number;
  customer_type: { pk: number; singular: string; plural: string };
  customer_prototype: { pk: number; display_name: string };
};

export type FHContact = {
  name: string;
  phone: string;
  email: string;
};

export type FHBooking = {
  pk: number;
  uuid: string;
  display_id: string;
  status: "booked" | "cancelled" | "rebooked" | "no-show";
  created_at: string;
  availability: FHAvailability;
  contact: FHContact;
  customers: {
    pk: number;
    customer_type_rate: FHCustomerTypeRate;
  }[];
  rebooked_from: string | null;
  rebooked_to: string | null;
  amount_paid: number; // cents
  receipt_total: number; // cents
  note: string;
  voucher_number: string;
  confirmation_url: string;
  company: { shortname: string; name: string };
};

export type FHBookingList = {
  bookings: FHBooking[];
};

type FHError = {
  error: string;
  status: number;
};

// ── Client ─────────────────────────────────────────────────────────

export class FareHarborClient {
  private appKey: string;
  private userKey: string;

  constructor(userKey: string) {
    const appKey = process.env.FAREHARBOR_APP_KEY;
    if (!appKey) throw new Error("FAREHARBOR_APP_KEY env variable is required");
    this.appKey = appKey;
    this.userKey = userKey;
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
      headers: {
        "X-FareHarbor-API-App": this.appKey,
        "X-FareHarbor-API-User": this.userKey,
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err: FHError = { error: text.slice(0, 300), status: res.status };
      throw new FareHarborError(
        `FareHarbor API ${res.status}: ${err.error}`,
        res.status
      );
    }

    return res.json() as Promise<T>;
  }

  /** List companies accessible with the user key. */
  async getCompanies(): Promise<FHCompany[]> {
    const data = await this.request<{ companies: FHCompany[] }>("/companies/");
    return data.companies;
  }

  /** Get a single company by shortname. */
  async getCompany(shortname: string): Promise<FHCompany> {
    const data = await this.request<{ company: FHCompany }>(
      `/companies/${encodeURIComponent(shortname)}/`
    );
    return data.company;
  }

  /** List bookable items (activities/tours) for a company. */
  async getItems(shortname: string): Promise<FHItem[]> {
    const data = await this.request<{ items: FHItem[] }>(
      `/companies/${encodeURIComponent(shortname)}/items/`
    );
    return data.items;
  }

  /** List availabilities for an item on a specific date. */
  async getAvailabilities(
    shortname: string,
    itemPk: number,
    date: string // YYYY-MM-DD
  ): Promise<FHAvailability[]> {
    const data = await this.request<{ availabilities: FHAvailability[] }>(
      `/companies/${encodeURIComponent(shortname)}/items/${itemPk}/minimal/availabilities/date/${date}/`
    );
    return data.availabilities;
  }

  /**
   * List bookings for a date range.
   * FareHarbor returns bookings across all items for the company.
   */
  async getBookings(
    shortname: string,
    dateStart: string, // YYYY-MM-DD
    dateEnd: string
  ): Promise<FHBooking[]> {
    const data = await this.request<FHBookingList>(
      `/companies/${encodeURIComponent(shortname)}/bookings/?start_date=${dateStart}&end_date=${dateEnd}`
    );
    return data.bookings;
  }

  /** Retrieve a single booking by UUID. */
  async getBooking(shortname: string, uuid: string): Promise<FHBooking> {
    const data = await this.request<{ booking: FHBooking }>(
      `/companies/${encodeURIComponent(shortname)}/bookings/${uuid}/`
    );
    return data.booking;
  }

  /** Test connection by fetching the companies list. */
  async testConnection(): Promise<{ ok: boolean; companies: string[] }> {
    try {
      const companies = await this.getCompanies();
      return { ok: true, companies: companies.map((c) => c.name) };
    } catch (err) {
      if (err instanceof FareHarborError) {
        throw err;
      }
      throw new FareHarborError("Connection failed", 0);
    }
  }
}

export class FareHarborError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FareHarborError";
    this.status = status;
  }
}
