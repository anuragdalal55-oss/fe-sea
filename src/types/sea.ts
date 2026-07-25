export interface SeaMblRecord {
  id: string;
  mbl_no: string;
  mbl_date?: string | null;
  // v2 MBL fields
  igm_no?: string | null;
  igm_date?: string | null;
  vessel_date?: string | null;
  vessel_code?: string | null;
  vessel_name?: string | null;
  line_no?: string | null;
  shipping_line?: string | null;
  imo_code?: string | null;
  // existing fields
  cargo_move?: string | null;
  port_of_delivery?: string | null;
  dest_cfs?: string | null;
  subline_no?: string | null;
  vessel_voyage_no?: string | null;
  port_of_loading?: string | null;
  port_of_unloading?: string | null;
  cargo_nature?: string | null;
  item_type?: string | null;
  importer_name?: string | null;
  importer_address1?: string | null;
  importer_address2?: string | null;
  importer_address3?: string | null;
  description?: string | null;
  marks_numbers?: string | null;
  transport?: string | null;
  bond_no?: string | null;
  carrier_name?: string | null;
  carrier_code?: string | null;
  mlo_name?: string | null;
  mlo_code?: string | null;
  total_packages: number | string;
  total_gross_weight: number | string;
  total_volume_cbm: number | string;
  customs_house_code?: string | null;
  profile_id?: string | null;
  profile_code?: string | null;
  company_name?: string | null;
  status: string;
  hbl_count?: number;
  tx_count?: number;
  created_at: string;
  updated_at: string;
  hbls?: SeaHblRecord[];
}

export interface SeaHblRecord {
  id: string;
  mbl_id: string;
  hbl_no: string;
  hbl_date?: string | null;
  // v2 HBL fields (moved from MBL)
  cargo_move?: string | null;
  port_of_delivery?: string | null;
  dest_cfs?: string | null;
  subline_no?: string | null;
  cargo_nature?: string | null;
  importer_name?: string | null;
  importer_address1?: string | null;
  importer_address2?: string | null;
  importer_address3?: string | null;
  carrier_name?: string | null;
  carrier_code?: string | null;
  bond_no?: string | null;
  transport?: string | null;
  mlo_name?: string | null;
  mlo_code?: string | null;
  // container fields
  container_no?: string | null;
  seal_no?: string | null;
  container_size?: string | null;
  container_type?: string | null;
  soc_flag?: string | null;
  agent_code?: string | null;
  package_count: number | string;
  gross_weight: number | string;
  cargo_net_weight: number | string;
  volume_cbm: number | string;
  package_type?: string | null;
  cargo_description?: string | null;
  marks_numbers?: string | null;
  hs_code?: string | null;
  imo_code?: string | null;
  item_type?: string | null;
  invoice_value_currency?: string | null;
  sort_order?: number;
  mbl_no?: string;
}

export interface SeaCarrierRecord {
  id: string;
  carrier_name: string;
  carrier_code: string;
  bond_number?: string | null;
  transport?: string | null;
  dest?: string | null;
  address?: string | null;
  description?: string | null;
  // null/empty = unrestricted ("All Locations") — visible from every login location.
  location_codes?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SeaCarrierForm {
  carrier_name: string;
  carrier_code: string;
  bond_number: string;
  transport: string;
  dest: string;
  address: string;
  description: string;
  location_codes: string[];
  all_locations: boolean;
}

export interface SeaMloRecord {
  id: string;
  mlo_name: string;
  mlo_code: string;
  agent_code?: string | null;
  // null/empty = unrestricted ("All Locations") — visible from every login location.
  location_codes?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SeaMloForm {
  mlo_name: string;
  mlo_code: string;
  agent_code: string;
  location_codes: string[];
  all_locations: boolean;
}

export interface SeaPortRecord {
  id: string;
  port_code: string;
  port_name: string;
  created_at: string;
  updated_at: string;
}

export interface SeaPortForm {
  port_code: string;
  port_name: string;
}

export interface SeaTransmissionRecord {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  username?: string | null;
  mbl_no?: string | null;
}

export interface SeaMblForm {
  // New v2 MBL section fields
  mbl_no: string;
  mbl_date: string;
  port_of_loading: string;
  vessel_date: string;
  igm_no: string;
  igm_date: string;
  vessel_code: string;
  imo_code: string;
  vessel_voyage_no: string;
  line_no: string;
  vessel_name: string;
  shipping_line: string;
  description: string;
  // Internal / submission fields
  customs_house_code: string;
  profile_id: string;
  total_packages: string;
  total_gross_weight: string;
  total_volume_cbm: string;
  // Backward-compat fields (kept for existing data / transmission logic)
  port_of_unloading: string;
  cargo_move: string;
  port_of_delivery: string;
  dest_cfs: string;
  subline_no: string;
  cargo_nature: string;
  item_type: string;
  importer_name: string;
  importer_address1: string;
  importer_address2: string;
  importer_address3: string;
  marks_numbers: string;
  transport: string;
  bond_no: string;
  carrier_name: string;
  carrier_code: string;
  mlo_name: string;
  mlo_code: string;
}

export interface SeaContainerRow {
  container_no: string;
  seal_no: string;
  package_count: string;
  weight: string;
  container_size: string;
  container_type: string; // FCL | LCL
  soc_flag: string; // N-NO | Y-YES
  agent_code: string;
}

export interface SeaHblForm {
  // Core HBL
  hbl_no: string;
  hbl_date: string;
  package_count: string;
  package_type: string;
  gross_weight: string;
  cargo_nature: string;
  item_type: string;
  // Fields moved from MBL
  cargo_move: string;
  port_of_delivery: string;
  dest_cfs: string;
  subline_no: string;
  importer_name: string;
  importer_address1: string;
  importer_address2: string;
  importer_address3: string;
  cargo_description: string;
  marks_numbers: string;
  carrier_name: string;
  carrier_code: string;
  bond_no: string;
  transport: string;
  mlo_name: string;
  mlo_code: string;
  // Multiple containers per HBL
  containers: SeaContainerRow[];
  // Kept for backward compat / transmission
  cargo_net_weight: string;
  volume_cbm: string;
  hs_code: string;
  imo_code: string;
  invoice_value_currency: string;
}
