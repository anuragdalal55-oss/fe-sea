import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { useAuth } from '../hooks/useAuth';
import {
  SeaCarrierRecord,
  SeaContainerRow,
  SeaHblForm,
  SeaMblForm,
  SeaMblRecord,
  SeaMloRecord,
  SeaTransmissionRecord,
} from '../types/sea';
import { fmtDate, fmtDateTime } from '../utils/dateUtils';
import api from '../utils/api';

const today = () => new Date().toISOString().slice(0, 10);

// Only 3 cargo move options as per requirement
const CARGO_MOVE_OPTIONS = [
  'TI-ICD Transhipment',
  'LC-LOCAL Cargo',
  'TC-Transhipment Cargo',
];

const CARGO_NATURE_OPTIONS = [
  'C-Containerized',
  'B-Break Bulk',
  'L-LCL',
  'G-General Cargo',
];

const ITEM_TYPE_OPTIONS = [
  'OT-Other Cargo',
  'DG-Dangerous Goods',
  'HV-High Value',
  'RF-Refrigerated',
];

// Full package code list as per requirement
const PACKAGE_CODE_OPTIONS = [
  { value: 'BDL', label: 'BDL (BUNDLE)' },
  { value: 'BGS', label: 'BGS (BAGS)' },
  { value: 'BLK', label: 'BLK (BULK)' },
  { value: 'BLO', label: 'BLO (BLOCKS)' },
  { value: 'BLS', label: 'BLS (BALES)' },
  { value: 'BOX', label: 'BOX (BOXES)' },
  { value: 'CAN', label: 'CAN (CANS)' },
  { value: 'CAS', label: 'CAS (CASES)' },
  { value: 'CLS', label: 'CLS (COILS)' },
  { value: 'CON', label: 'CON (CONTAI)' },
  { value: 'CRT', label: 'CRT (CRATES)' },
  { value: 'CTN', label: 'CTN (CARTON)' },
  { value: 'COL', label: 'COL (COLLIE)' },
  { value: 'DRM', label: 'DRM (DRUMS)' },
  { value: 'LOG', label: 'LOG (LOGS)' },
  { value: 'PAL', label: 'PAL (PALLS)' },
  { value: 'PKG', label: 'PKG (PACKAG)' },
  { value: 'PLT', label: 'PLT (PALLET)' },
  { value: 'PCS', label: 'PCS (PIECES)' },
  { value: 'RLS', label: 'RLS (ROLLS)' },
  { value: 'REL', label: 'REL (REELS)' },
  { value: 'SKD', label: 'SKD (SKID)' },
  { value: 'UNT', label: 'UNT (UNITS)' },
  { value: 'BRL', label: 'BRL (BARREL)' },
];

const CONTAINER_STATUS_OPTIONS = ['FCL', 'LCL'];
const SOC_FLAG_OPTIONS = ['N-NO', 'Y-YES'];

// Loading port options (searchable autocomplete)
const LOADING_PORT_OPTIONS = [
  { code: 'DKKAL', name: 'KALUNDBORG', label: '(DKKAL) -- KALUNDBORG' },
  { code: 'JPOMZ', name: 'OMAEZAKI', label: '(JPOMZ) -- OMAEZAKI' },
  { code: 'CNXTA', name: 'XINGTAN', label: '(CNXTA) -- XINGTAN' },
  { code: 'DERTD', name: 'ROTTERDAM GERMA', label: '(DERTD) -- ROTTERDAM GERMA' },
  { code: 'CNRZH', name: 'RIZHAO', label: '(CNRZH) -- RIZHAO' },
  { code: 'DKFRC', name: 'FREDERICIA', label: '(DKFRC) -- FREDERICIA' },
  { code: 'QAHMD', name: 'HAMAD, QATAR', label: '(QAHMD) -- HAMAD, QATAR' },
  { code: 'USNYC', name: 'NEW YORK', label: '(USNYC) -- NEW YORK' },
  { code: 'CNXIN', name: 'XINHUI', label: '(CNXIN) -- XINHUI' },
  { code: 'BRNAT', name: 'NATAL', label: '(BRNAT) -- NATAL' },
  { code: 'MYKUA', name: 'KUANTAN', label: '(MYKUA) -- KUANTAN' },
  { code: 'CNHFE', name: 'HEFEI', label: '(CNHFE) -- HEFEI' },
  { code: 'DOCAU', name: 'CAUCEDO', label: '(DOCAU) -- CAUCEDO' },
  { code: 'VNVUT', name: 'BA RIA VUNG TAU', label: '(VNVUT) -- BA RIA VUNG TAU' },
  { code: 'IDMAK', name: 'MAKASSAR', label: '(IDMAK) -- MAKASSAR' },
  { code: 'PRSJU', name: 'SAN JUAN', label: '(PRSJU) -- SAN JUAN' },
  { code: 'USATL', name: 'ATLANTA', label: '(USATL) -- ATLANTA' },
  { code: 'EGDAM', name: 'DAMIETTA', label: '(EGDAM) -- DAMIETTA' },
  { code: 'JPHKT', name: 'HAKATA', label: '(JPHKT) -- HAKATA' },
  { code: 'CHI', name: 'CHICAGO', label: '(CHI) -- CHICAGO' },
  { code: 'GBPRU', name: 'PORTBURY', label: '(GBPRU) -- PORTBURY' },
  { code: 'LTKLJ', name: 'KLAIPEDA', label: '(LTKLJ) -- KLAIPEDA' },
  { code: 'NOOSL', name: 'OSLO', label: '(NOOSL) -- OSLO' },
  { code: 'ESGIJ', name: 'GIJON', label: '(ESGIJ) -- GIJON' },
  { code: 'TNTUN', name: 'TUNIS', label: '(TNTUN) -- TUNIS' },
  { code: 'PECLL', name: 'CALLAO', label: '(PECLL) -- CALLAO' },
  { code: 'GRHER', name: 'HERAKLION', label: '(GRHER) -- HERAKLION' },
  { code: 'ZACPT', name: 'CAPE TOWN', label: '(ZACPT) -- CAPE TOWN' },
  { code: 'SADMN', name: 'DAMMAN', label: '(SADMN) -- DAMMAN' },
  { code: 'CNMFG', name: 'MAFANG CHINA', label: '(CNMFG) -- MAFANG CHINA' },
  { code: 'KRINC', name: 'INCHEON KOREA', label: '(KRINC) -- INCHEON KOREA' },
  { code: 'TWTPE', name: 'TAIPEI', label: '(TWTPE) -- TAIPEI' },
  { code: 'MATNG', name: 'TANGIER', label: '(MATNG) -- TANGIER' },
  { code: 'CNYIC', name: 'YICHANG', label: '(CNYIC) -- YICHANG' },
  { code: 'GBJER', name: 'JERSEY', label: '(GBJER) -- JERSEY' },
  { code: 'CNYUY', name: 'YUEYANG', label: '(CNYUY) -- YUEYANG' },
  { code: 'FRDKK', name: 'DUNKERQUE', label: '(FRDKK) -- DUNKERQUE' },
  { code: 'PHSFS', name: 'SUBIC BAY', label: '(PHSFS) -- SUBIC BAY' },
  { code: 'ARBUE', name: 'BUENOS AIRES', label: '(ARBUE) -- BUENOS AIRES' },
  { code: 'IDBTM', name: 'BATAM', label: '(IDBTM) -- BATAM' },
  { code: 'AUTSV', name: 'TOWNSVILLE', label: '(AUTSV) -- TOWNSVILLE' },
  { code: 'HNPCR', name: 'PUERTO CORTES', label: '(HNPCR) -- PUERTO CORTES' },
  { code: 'SNDKR', name: 'DAKAR', label: '(SNDKR) -- DAKAR' },
  { code: 'CNGAS', name: 'GAOSHA', label: '(CNGAS) -- GAOSHA' },
  { code: 'CNTAG', name: 'TAICANG', label: '(CNTAG) -- TAICANG' },
  { code: 'JPSMN', name: 'SAKAIMINETO', label: '(JPSMN) -- SAKAIMINETO' },
  { code: 'PTBAN', name: 'LISBOA', label: '(PTBAN) -- LISBOA' },
  { code: 'DKCSF', name: 'COPENHAGEN', label: '(DKCSF) -- COPENHAGEN' },
  { code: 'USMOB', name: 'MOBILE', label: '(USMOB) -- MOBILE' },
  { code: 'TRTEK', name: 'TEKIRDAG', label: '(TRTEK) -- TEKIRDAG' },
  { code: 'CNGUG', name: 'FUQING', label: '(CNGUG) -- FUQING' },
  { code: 'IEORK', name: 'CORK', label: '(IEORK) -- CORK' },
  { code: 'GHTEM', name: 'TEMA', label: '(GHTEM) -- TEMA' },
  { code: 'ITVDL', name: 'VADO LIGURE', label: '(ITVDL) -- VADO LIGURE' },
  { code: 'NOAES', name: 'AALESUND', label: '(NOAES) -- AALESUND' },
  { code: 'GEPTI', name: 'POTI, GEORGIA', label: '(GEPTI) -- POTI, GEORGIA' },
  { code: 'RUNVS', name: 'NOVOROSSIYSK', label: '(RUNVS) -- NOVOROSSIYSK' },
  { code: 'SAJUB', name: 'JUBAIL', label: '(SAJUB) -- JUBAIL' },
  { code: 'CNCAN', name: 'GUANGZHOU', label: '(CNCAN) -- GUANGZHOU' },
  { code: 'CNWUC', name: 'WUCHONGKOU', label: '(CNWUC) -- WUCHONGKOU' },
  { code: 'TRKMX', name: 'KUMPORT', label: '(TRKMX) -- KUMPORT' },
  { code: 'THSCS', name: 'SAHATHAI', label: '(THSCS) -- SAHATHAI' },
  { code: 'CNAQG', name: 'ANQING', label: '(CNAQG) -- ANQING' },
  { code: 'VNNGH', name: 'NGHI SON', label: '(VNNGH) -- NGHI SON' },
  { code: 'CNCIV', name: 'CIVET', label: '(CNCIV) -- CIVET' },
  { code: 'USSEA', name: 'SEATTLE', label: '(USSEA) -- SEATTLE' },
  { code: 'MUPLU', name: 'PORT LOUIS', label: '(MUPLU) -- PORT LOUIS' },
  { code: 'ECGYE', name: 'GUAYAQUIL', label: '(ECGYE) -- GUAYAQUIL' },
  { code: 'TERMAD', name: 'MARDAS TURKEY', label: '(TERMAD) -- MARDAS TURKEY' },
  { code: 'DJJIB', name: 'DJIBOUTI', label: '(DJJIB) -- DJIBOUTI' },
  { code: 'ITSAL', name: 'SALERNO', label: '(ITSAL) -- SALERNO' },
  { code: 'JPMOJ', name: 'MOJI JAPAN', label: '(JPMOJ) -- MOJI JAPAN' },
  { code: 'GBIMM', name: 'IMMINGHAM', label: '(GBIMM) -- IMMINGHAM' },
  { code: 'CNWEI', name: 'WEIHAI', label: '(CNWEI) -- WEIHAI' },
  { code: 'PHDVO', name: 'DAVAO', label: '(PHDVO) -- DAVAO' },
  { code: 'THSGZ', name: 'SONGKHLA', label: '(THSGZ) -- SONGKHLA' },
  { code: 'MYSDK', name: 'SANDAKAN', label: '(MYSDK) -- SANDAKAN' },
  { code: 'CNWUZ', name: 'WUZHOU', label: '(CNWUZ) -- WUZHOU' },
  { code: 'UAODS', name: 'ODESSA UKRAINE', label: '(UAODS) -- ODESSA UKRAINE' },
  { code: 'CLVAP', name: 'VALPARAISO', label: '(CLVAP) -- VALPARAISO' },
  { code: 'VNDAD', name: 'DA NANG', label: '(VNDAD) -- DA NANG' },
  { code: 'KWKWI', name: 'KUWAIT', label: '(KWKWI) -- KUWAIT' },
  { code: 'ILASH', name: 'ASHDOD', label: '(ILASH) -- ASHDOD' },
  { code: 'GRVOL', name: 'VOLOS', label: '(GRVOL) -- VOLOS' },
  { code: 'NZTRG', name: 'TAURANGA', label: '(NZTRG) -- TAURANGA' },
  { code: 'ITVCE', name: 'VENICE ITALY', label: '(ITVCE) -- VENICE ITALY' },
  { code: 'CNCSX', name: 'CHANGSHA', label: '(CNCSX) -- CHANGSHA' },
  { code: 'BGBOJ', name: 'BURGAS', label: '(BGBOJ) -- BURGAS' },
  { code: 'TRAMB', name: 'AMBARLI TURKEY', label: '(TRAMB) -- AMBARLI TURKEY' },
  { code: 'HRRJK', name: 'RIJEKA', label: '(HRRJK) -- RIJEKA' },
  { code: 'TRYAR', name: 'YARIMCA', label: '(TRYAR) -- YARIMCA' },
  { code: 'RULED', name: 'PETERSBURG', label: '(RULED) -- PETERSBURG' },
  { code: 'KHPNH', name: 'PHNOM PENH', label: '(KHPNH) -- PHNOM PENH' },
  { code: 'NOAES', name: 'ALESUND', label: '(NOAES) -- ALESUND' },
  { code: 'GBGRG', name: 'GRANGEMOUTH', label: '(GBGRG) -- GRANGEMOUTH' },
  { code: 'ESAGP', name: 'MALAGA', label: '(ESAGP) -- MALAGA' },
  { code: 'AUADL', name: 'ADELAIDE', label: '(AUADL) -- ADELAIDE' },
  { code: 'NZAKL', name: 'AUCKLAND', label: '(NZAKL) -- AUCKLAND' },
  { code: 'JPOSA', name: 'OSAKA', label: '(JPOSA) -- OSAKA' },
  { code: 'FIRAU', name: 'RAUMA', label: '(FIRAU) -- RAUMA' },
  { code: 'CNSDG', name: 'SHUIDONG', label: '(CNSDG) -- SHUIDONG' },
  { code: 'MYTWU', name: 'TAWAU MALAYSIA', label: '(MYTWU) -- TAWAU MALAYSIA' },
  { code: 'MXVER', name: 'VERACRUZ', label: '(MXVER) -- VERACRUZ' },
  { code: 'UAILK', name: 'CHORNOMORSK', label: '(UAILK) -- CHORNOMORSK' },
  { code: 'LVRIX', name: 'RIGA', label: '(LVRIX) -- RIGA' },
  { code: 'CNGAY', name: 'GAOYAO', label: '(CNGAY) -- GAOYAO' },
  { code: 'LBBEY', name: 'BEIRUT', label: '(LBBEY) -- BEIRUT' },
  { code: 'PHMNL', name: 'MANILA', label: '(PHMNL) -- MANILA' },
  { code: 'VNTCT', name: 'CAI MEP', label: '(VNTCT) -- CAI MEP' },
  { code: 'TRISK', name: 'ISKENDERUN', label: '(TRISK) -- ISKENDERUN' },
  { code: 'CNLUU', name: 'LELIU', label: '(CNLUU) -- LELIU' },
  { code: 'JPMIZ', name: 'MIZUSHIMA', label: '(JPMIZ) -- MIZUSHIMA' },
  { code: 'COCTG', name: 'CARTAGENA', label: '(COCTG) -- CARTAGENA' },
  { code: 'BEZEE', name: 'ZEEBRUGGE', label: '(BEZEE) -- ZEEBRUGGE' },
  { code: 'BRITJ', name: 'ITAJAI BRAZIL', label: '(BRITJ) -- ITAJAI BRAZIL' },
  { code: 'BRSSA', name: 'SALVADOR', label: '(BRSSA) -- SALVADOR' },
  { code: 'VNSGN', name: 'HOCHI MINH CITY', label: '(VNSGN) -- HOCHI MINH CITY' },
  { code: 'CHSCH', name: 'SCHAFFHAUSEN', label: '(CHSCH) -- SCHAFFHAUSEN' },
  { code: 'MXATM', name: 'ALTAMIRA', label: '(MXATM) -- ALTAMIRA' },
  { code: 'BRVIX', name: 'VITORIA', label: '(BRVIX) -- VITORIA' },
  { code: 'JPMIZ', name: 'MUZUSHIMA', label: '(JPMIZ) -- MUZUSHIMA' },
  { code: 'SEGOT', name: 'GOTEBORG', label: '(SEGOT) -- GOTEBORG' },
  { code: 'ESMPG', name: 'MARIN', label: '(ESMPG) -- MARIN' },
  { code: 'AUBNE', name: 'BRISBANE', label: '(AUBNE) -- BRISBANE' },
  { code: 'ITNPO', name: 'NAPLES, NAPOLI', label: '(ITNPO) -- NAPLES, NAPOLI' },
  { code: 'IDBLW', name: 'BELAWAN', label: '(IDBLW) -- BELAWAN' },
  { code: 'VNCMT', name: 'CAI MEP', label: '(VNCMT) -- CAI MEP' },
  { code: 'VNTOT', name: 'CAI MEP', label: '(VNTOT) -- CAI MEP' },
  { code: 'ARZAE', name: 'ZARATE', label: '(ARZAE) -- ZARATE' },
  { code: 'SESTO', name: 'STOCKHOLM', label: '(SESTO) -- STOCKHOLM' },
  { code: 'ITTPS', name: 'TRAPANI', label: '(ITTPS) -- TRAPANI' },
  { code: 'BRIOA', name: 'ITAPOA', label: '(BRIOA) -- ITAPOA' },
  { code: 'ARBUE', name: 'BUENOS ARIES', label: '(ARBUE) -- BUENOS ARIES' },
  { code: 'IRBND', name: 'BANDAR ABBAS', label: '(IRBND) -- BANDAR ABBAS' },
  { code: 'TNSFA', name: 'SFAX', label: '(TNSFA) -- SFAX' },
  { code: 'CNZAP', name: 'ZHAPU', label: '(CNZAP) -- ZHAPU' },
  { code: 'SEPIT', name: 'PITEA', label: '(SEPIT) -- PITEA' },
  { code: 'AUSYD', name: 'SYDNEY AUSTRALIA', label: '(AUSYD) -- SYDNEY AUSTRALIA' },
  { code: 'CNYZH', name: 'YANGZHOU', label: '(CNYZH) -- YANGZHOU' },
  { code: 'TRALI', name: 'ALIAGA', label: '(TRALI) -- ALIAGA' },
  { code: 'OMSOH', name: 'SOHAR', label: '(OMSOH) -- SOHAR' },
  { code: 'ITCVV', name: 'CIVITAVECCHIA', label: '(ITCVV) -- CIVITAVECCHIA' },
  { code: 'FIHEL', name: 'HELSINKI', label: '(FIHEL) -- HELSINKI' },
  { code: 'FIKTK', name: 'KOTKA', label: '(FIKTK) -- KOTKA' },
  { code: 'MYBTU', name: 'BINTULU, MALAYSIA', label: '(MYBTU) -- BINTULU, MALAYSIA' },
  { code: 'VNCLI', name: 'CAT LAI', label: '(VNCLI) -- CAT LAI' },
  { code: 'CNWNZ', name: 'WENZHOU', label: '(CNWNZ) -- WENZHOU' },
  { code: 'BHBAH', name: 'BAHRAIN', label: '(BHBAH) -- BAHRAIN' },
  { code: 'TRKMX', name: 'KUMPORT, TURKEY', label: '(TRKMX) -- KUMPORT, TURKEY' },
  { code: 'SAJED', name: 'JEDDAH', label: '(SAJED) -- JEDDAH' },
  { code: 'AEJEA', name: 'JEBEL ALI', label: '(AEJEA) -- JEBEL ALI' },
  { code: 'ITRAN', name: 'RAVENNA', label: '(ITRAN) -- RAVENNA' },
  { code: 'MXZLO', name: 'MANZANILLO', label: '(MXZLO) -- MANZANILLO' },
  { code: 'AULIV', name: 'LIVERPOOL', label: '(AULIV) -- LIVERPOOL' },
  { code: 'UAILK', name: 'CHORNOMORSK', label: '(UAILK) -- CHORNOMORSK' },
  { code: 'GBSSH', name: 'SOUTH SHIELDS', label: '(GBSSH) -- SOUTH SHIELDS' },
  { code: 'IDTPP', name: 'TANJUNG PRIOK', label: '(IDTPP) -- TANJUNG PRIOK' },
  { code: 'CNSIN', name: 'SHATIAN', label: '(CNSIN) -- SHATIAN' },
  { code: 'TRALI', name: 'TRALI ALIGA', label: '(TRALI) -- TRALI ALIGA' },
  { code: 'IDTPK', name: 'TAPAKTUAN SUMATRA', label: '(IDTPK) -- TAPAKTUAN SUMATRA' },
  { code: 'BRSSZ', name: 'SANTOS', label: '(BRSSZ) -- SANTOS' },
  { code: 'CNYNF', name: 'YUNFU', label: '(CNYNF) -- YUNFU' },
  { code: 'BRRIG', name: 'RIO GRANDE', label: '(BRRIG) -- RIO GRANDE' },
  { code: 'USTIW', name: 'TACOMA', label: '(USTIW) -- TACOMA' },
  { code: 'ITBRI', name: 'BARI, ITALY', label: '(ITBRI) -- BARI, ITALY' },
  { code: 'VNDAD', name: 'DANANG', label: '(VNDAD) -- DANANG' },
  { code: 'CNJIA', name: 'JIANGYIN', label: '(CNJIA) -- JIANGYIN' },
  { code: 'PHCEB', name: 'CEBU PHILIPPINES', label: '(PHCEB) -- CEBU PHILIPPINES' },
  { code: 'BDCGP', name: 'CHITTAGONG', label: '(BDCGP) -- CHITTAGONG' },
  { code: 'TZDAR', name: 'DAR ES SALAAM TANZANIA', label: '(TZDAR) -- DAR ES SALAAM TANZANIA' },
  { code: 'EGALY', name: 'ALEXANDRIA', label: '(EGALY) -- ALEXANDRIA' },
  { code: 'DKCPH', name: 'KOBENHAVN', label: '(DKCPH) -- KOBENHAVN' },
  { code: 'MYPGU', name: 'PASIR GUDANG', label: '(MYPGU) -- PASIR GUDANG' },
  { code: 'USNEW', name: 'NEW ORLEANS', label: '(USNEW) -- NEW ORLEANS' },
  { code: 'EGPSD', name: 'PORT SAID EG', label: '(EGPSD) -- PORT SAID EG' },
  { code: 'ROCND', name: 'CONSTANTA', label: '(ROCND) -- CONSTANTA' },
  { code: 'CAMTR', name: 'MONTREAL CANADA', label: '(CAMTR) -- MONTREAL CANADA' },
  { code: 'DEWVN', name: 'WILHELMSHAVEN GERMANY', label: '(DEWVN) -- WILHELMSHAVEN GERMANY' },
  { code: 'CNQIN', name: 'QINHUANGDAO', label: '(CNQIN) -- QINHUANGDAO' },
  { code: 'BGVAR', name: 'VARNA BULGARIA', label: '(BGVAR) -- VARNA BULGARIA' },
  { code: 'CNJIX', name: 'JIAXING', label: '(CNJIX) -- JIAXING' },
  { code: 'USORF', name: 'NORFOLK', label: '(USORF) -- NORFOLK' },
  { code: 'JPTYO', name: 'TOKYO', label: '(JPTYO) -- TOKYO' },
  { code: 'ALDRZ', name: 'DURRES', label: '(ALDRZ) -- DURRES' },
  { code: 'JPSMZ', name: 'SHIMIZU', label: '(JPSMZ) -- SHIMIZU' },
  { code: 'NGAPP', name: 'APAPA NIGERIA', label: '(NGAPP) -- APAPA NIGERIA' },
  { code: 'CNHAK', name: 'HAIKOU', label: '(CNHAK) -- HAIKOU' },
  { code: 'VNVUT', name: 'VUNG TAU', label: '(VNVUT) -- VUNG TAU' },
  { code: 'CNKAI', name: 'KAIKOU', label: '(CNKAI) -- KAIKOU' },
  { code: 'ESBCN', name: 'BARCELONA', label: '(ESBCN) -- BARCELONA' },
  { code: 'ITTRS', name: 'TRIESTE', label: '(ITTRS) -- TRIESTE' },
  { code: 'KRKAN', name: 'KWANGYANG', label: '(KRKAN) -- KWANGYANG' },
  { code: 'CLLQN', name: 'LIRQUAN', label: '(CLLQN) -- LIRQUAN' },
  { code: 'ITTRS', name: 'TRIESTE', label: '(ITTRS) -- TRIESTE' },
  { code: 'USBMI', name: 'BALTIMORE', label: '(USBMI) -- BALTIMORE' },
  { code: 'CNHGW', name: 'HONGWAN', label: '(CNHGW) -- HONGWAN' },
  { code: 'JPYOK', name: 'YOKOHAMA', label: '(JPYOK) -- YOKOHAMA' },
  { code: 'ESVGO', name: 'VIGO', label: '(ESVGO) -- VIGO' },
  { code: 'CNQZH', name: 'QINZHOU', label: '(CNQZH) -- QINZHOU' },
  { code: 'PTSIE', name: 'SINES', label: '(PTSIE) -- SINES' },
  { code: 'CNZUH', name: 'ZHUHAI', label: '(CNZUH) -- ZHUHAI' },
  { code: 'CNGLN', name: 'GAOLAN ZHUHAI', label: '(CNGLN) -- GAOLAN ZHUHAI' },
  { code: 'EETLL', name: 'TALLINN', label: '(EETLL) -- TALLINN' },
  { code: 'CNLYG', name: 'LIANYUNGANG', label: '(CNLYG) -- LIANYUNGANG' },
  { code: 'CNNKG', name: 'NANJING', label: '(CNNKG) -- NANJING' },
  { code: 'IDSUB', name: 'SURABAYA', label: '(IDSUB) -- SURABAYA' },
  { code: 'KEMBA', name: 'MOMBASA', label: '(KEMBA) -- MOMBASA' },
  { code: 'EETLL', name: 'ESTONIA', label: '(EETLL) -- ESTONIA' },
  { code: 'BRNVT', name: 'NAVEGANTES', label: '(BRNVT) -- NAVEGANTES' },
  { code: 'CNCZX', name: 'CHANGZHOU', label: '(CNCZX) -- CHANGZHOU' },
  { code: 'KRINC', name: 'INCHON', label: '(KRINC) -- INCHON' },
  { code: 'CNLUU', name: 'LELIU', label: '(CNLUU) -- LELIU' },
  { code: 'CNWUH', name: 'WUHAN', label: '(CNWUH) -- WUHAN' },
  { code: 'BRPNG', name: 'PARANAGUA', label: '(BRPNG) -- PARANAGUA' },
  { code: 'SEHAD', name: 'HALMSTAD', label: '(SEHAD) -- HALMSTAD' },
  { code: 'CLCAS', name: 'CASABLANC', label: '(CLCAS) -- CASABLANC' },
  { code: 'GRSKG', name: 'THESSALONIKI', label: '(GRSKG) -- THESSALONIKI' },
  { code: 'TRSSX', name: 'SAMSUN', label: '(TRSSX) -- SAMSUN' },
  { code: 'CNKHN', name: 'NANCHANG', label: '(CNKHN) -- NANCHANG' },
  { code: 'ITLIV', name: 'LEGHORN', label: '(ITLIV) -- LEGHORN' },
  { code: 'KHKOS', name: 'SIHANOUKVILLE', label: '(KHKOS) -- SIHANOUKVILLE' },
  { code: 'SVAQJ', name: 'ACAJUTLA', label: '(SVAQJ) -- ACAJUTLA' },
  { code: 'GRPIR', name: 'PIRAEUS', label: '(GRPIR) -- PIRAEUS' },
  { code: 'GBBEL', name: 'BELFAST', label: '(GBBEL) -- BELFAST' },
  { code: 'CNSHG', name: 'SANSHAN', label: '(CNSHG) -- SANSHAN' },
  { code: 'QADOH', name: 'DOHA', label: '(QADOH) -- DOHA' },
  { code: 'TRAYT', name: 'ANTALYA', label: '(TRAYT) -- ANTALYA' },
  { code: 'CNNKG', name: 'NANJIING', label: '(CNNKG) -- NANJIING' },
  { code: 'CNZQG', name: 'ZHAOQING', label: '(CNZQG) -- ZHAOQING' },
  { code: 'GBSOU', name: 'SOUTHAMPTON', label: '(GBSOU) -- SOUTHAMPTON' },
  { code: 'PKKHI', name: 'KARACHI', label: '(PKKHI) -- KARACHI' },
  { code: 'CAVAN', name: 'VANCOUVER', label: '(CAVAN) -- VANCOUVER' },
  { code: 'ITLIV', name: 'LIVORNO', label: '(ITLIV) -- LIVORNO' },
  { code: 'SEGOT', name: 'GOTHENBURG', label: '(SEGOT) -- GOTHENBURG' },
  { code: 'JPNGO', name: 'NAGOYA', label: '(JPNGO) -- NAGOYA' },
  { code: 'CNGOM', name: 'GAOMING', label: '(CNGOM) -- GAOMING' },
  { code: 'USLJB', name: 'LISBON', label: '(USLJB) -- LISBON' },
  { code: 'GBMNC', name: 'MANCHESTER', label: '(GBMNC) -- MANCHESTER' },
  { code: 'CNLSI', name: 'LANSHI', label: '(CNLSI) -- LANSHI' },
  { code: 'PTLEI', name: 'LEIXOES', label: '(PTLEI) -- LEIXOES' },
  { code: 'USOAK', name: 'OAKLAND', label: '(USOAK) -- OAKLAND' },
  { code: 'USMIA', name: 'MIAMI', label: '(USMIA) -- MIAMI' },
  { code: 'TRGEB', name: 'GEBZE TURKEY', label: '(TRGEB) -- GEBZE TURKEY' },
  { code: 'ITNAP', name: 'NAPLE NAPOLI ITALY', label: '(ITNAP) -- NAPLE NAPOLI ITALY' },
  { code: 'ESALG', name: 'ALGECIRAS SPAIN', label: '(ESALG) -- ALGECIRAS SPAIN' },
  { code: 'CNFOS', name: 'FOSHAN', label: '(CNFOS) -- FOSHAN' },
  { code: 'CNSBU', name: 'SANBU', label: '(CNSBU) -- SANBU' },
  { code: 'CNNTG', name: 'NANTONG', label: '(CNNTG) -- NANTONG' },
  { code: 'CNTSN', name: 'TIANJIN', label: '(CNTSN) -- TIANJIN' },
  { code: 'CNSJQ', name: 'SANSHUI', label: '(CNSJQ) -- SANSHUI' },
  { code: 'CNLYG', name: 'LIANYUNGANG PORT', label: '(CNLYG) -- LIANYUNGANG PORT' },
  { code: 'CNFOC', name: 'FUZHOU', label: '(CNFOC) -- FUZHOU' },
  { code: 'ITRAN', name: 'RANENNA ITALIA', label: '(ITRAN) -- RANENNA ITALIA' },
  { code: 'THBKK', name: 'BANGKOK', label: '(THBKK) -- BANGKOK' },
  { code: 'TREVY', name: 'EVYAP', label: '(TREVY) -- EVYAP' },
  { code: 'USJKV', name: 'JACKSONVILLE', label: '(USJKV) -- JACKSONVILLE' },
  { code: 'USVNC', name: 'VENICE', label: '(USVNC) -- VENICE' },
  { code: 'MMRGN', name: 'YANGON', label: '(MMRGN) -- YANGON' },
  { code: 'CNJIU', name: 'JIUJIANG', label: '(CNJIU) -- JIUJIANG' },
  { code: 'TWKHH', name: 'KAOHSIUNG', label: '(TWKHH) -- KAOHSIUNG' },
  { code: 'JPUKB', name: 'KOBE', label: '(JPUKB) -- KOBE' },
  { code: 'ESBIO', name: 'BILBAO', label: '(ESBIO) -- BILBAO' },
  { code: 'CAHAL', name: 'HALIFAX NS', label: '(CAHAL) -- HALIFAX NS' },
  { code: 'ZADUR', name: 'DURBAN ZA', label: '(ZADUR) -- DURBAN ZA' },
  { code: 'ILHFA', name: 'HAIFA', label: '(ILHFA) -- HAIFA' },
  { code: 'TRIST', name: 'ISTANBUL', label: '(TRIST) -- ISTANBUL' },
  { code: 'FRFOS', name: 'FOS SUR MER', label: '(FRFOS) -- FOS SUR MER' },
  { code: 'CNSHA', name: 'SHANGHAI', label: '(CNSHA) -- SHANGHAI' },
  { code: 'CNCWN', name: 'CHIWAN', label: '(CNCWN) -- CHIWAN' },
  { code: 'CNSWA', name: 'SHANTOU', label: '(CNSWA) -- SHANTOU' },
  { code: 'CNMAW', name: 'MAWEI FUZHOU', label: '(CNMAW) -- MAWEI FUZHOU' },
  { code: 'TRIZT', name: 'IZMIT', label: '(TRIZT) -- IZMIT' },
  { code: 'CNBHY', name: 'BEIHAI', label: '(CNBHY) -- BEIHAI' },
  { code: 'USLGB', name: 'LONG BEACH', label: '(USLGB) -- LONG BEACH' },
  { code: 'GBNWK', name: 'NEWARK', label: '(GBNWK) -- NEWARK' },
  { code: 'CLLSQ', name: 'LOS ANGELES', label: '(CLLSQ) -- LOS ANGELES' },
  { code: 'ITAOI', name: 'ANCONA', label: '(ITAOI) -- ANCONA' },
  { code: 'CNZJG', name: 'ZHANGJIAGANG', label: '(CNZJG) -- ZHANGJIAGANG' },
  { code: 'CNWHI', name: 'WUHU CHINA', label: '(CNWHI) -- WUHU CHINA' },
  { code: 'JOAQJ', name: 'AQABA JORDON', label: '(JOAQJ) -- AQABA JORDON' },
  { code: 'DEBRV', name: 'BREMERHAVEN', label: '(DEBRV) -- BREMERHAVEN' },
  { code: 'TWKHH', name: 'TAICHUNG TAIWAN', label: '(TWKHH) -- TAICHUNG TAIWAN' },
  { code: 'USPTM', name: 'PORTSMOUTH', label: '(USPTM) -- PORTSMOUTH' },
  { code: 'ITSPE', name: 'LA SPEZIA', label: '(ITSPE) -- LA SPEZIA' },
  { code: 'FRLEH', name: 'LE HAVRE', label: '(FRLEH) -- LE HAVRE' },
  { code: 'CNDLC', name: 'DALIAN', label: '(CNDLC) -- DALIAN' },
  { code: 'SEHEL', name: 'HELSINGBORG', label: '(SEHEL) -- HELSINGBORG' },
  { code: 'USCST', name: 'CHARLESTON', label: '(USCST) -- CHARLESTON' },
  { code: 'TRMER', name: 'MERSIN TURKEY', label: '(TRMER) -- MERSIN TURKEY' },
  { code: 'CNSUD', name: 'SHUNDE', label: '(CNSUD) -- SHUNDE' },
  { code: 'TWKEL', name: 'KEELUNG TAIWAN', label: '(TWKEL) -- KEELUNG TAIWAN' },
  { code: 'SIKOP', name: 'KOPER', label: '(SIKOP) -- KOPER' },
  { code: 'LKCMB', name: 'COLOMBO LK', label: '(LKCMB) -- COLOMBO LK' },
  { code: 'CNSZX', name: 'SHENZHEN DA CHAN BAY', label: '(CNSZX) -- SHENZHEN DA CHAN BAY' },
  { code: 'BEANR', name: 'ANTWERP BELGIUM', label: '(BEANR) -- ANTWERP BELGIUM' },
  { code: 'DKAAR', name: 'AARHUS DENMARK', label: '(DKAAR) -- AARHUS DENMARK' },
  { code: 'GBLGP', name: 'LONDON GATEWAY PORT', label: '(GBLGP) -- LONDON GATEWAY PORT' },
  { code: 'USBSN', name: 'BOSTON', label: '(USBSN) -- BOSTON' },
  { code: 'ESVLC', name: 'VALENCIA', label: '(ESVLC) -- VALENCIA' },
  { code: 'CLSAI', name: 'SAN ANTONIO CHILE', label: '(CLSAI) -- SAN ANTONIO CHILE' },
  { code: 'CNCKG', name: 'CHONGQING', label: '(CNCKG) -- CHONGQING' },
  { code: 'EGSOK', name: 'SOKHNA PORT', label: '(EGSOK) -- SOKHNA PORT' },
  { code: 'USORF', name: 'NORFOLK', label: '(USORF) -- NORFOLK' },
  { code: 'PLGDN', name: 'GDANSK', label: '(PLGDN) -- GDANSK' },
  { code: 'CNJMN', name: 'JIANGMEN', label: '(CNJMN) -- JIANGMEN' },
  { code: 'AEAUH', name: 'ABU DHABI', label: '(AEAUH) -- ABU DHABI' },
  { code: 'AROES', name: 'SAN ANTONIO OESTE', label: '(AROES) -- SAN ANTONIO OESTE' },
  { code: 'AUMEL', name: 'MELBOURNE', label: '(AUMEL) -- MELBOURNE' },
  { code: 'AUFRE', name: 'FREMANTLE', label: '(AUFRE) -- FREMANTLE' },
  { code: 'PKBQM', name: 'PORT QASIM', label: '(PKBQM) -- PORT QASIM' },
  { code: 'IDSRG', name: 'SEMARANG', label: '(IDSRG) -- SEMARANG' },
  { code: 'AEJEA', name: 'JEBEL ALI UAE', label: '(AEJEA) -- JEBEL ALI UAE' },
  { code: 'DEHAM', name: 'HAMBURG GERMANY', label: '(DEHAM) -- HAMBURG GERMANY' },
  { code: 'CNHUA', name: 'HUANGPU', label: '(CNHUA) -- HUANGPU' },
  { code: 'LTKLJ', name: 'KLIPEDA LITHUANIA', label: '(LTKLJ) -- KLIPEDA LITHUANIA' },
  { code: 'VNSGN', name: 'IAEM CHABANG', label: '(VNSGN) -- IAEM CHABANG' },
  { code: 'VNHPH', name: 'HAIPHONG VIETNAM', label: '(VNHPH) -- HAIPHONG VIETNAM' },
  { code: 'USHQN', name: 'HOUSTON', label: '(USHQN) -- HOUSTON' },
  { code: 'IDJKT', name: 'JAKARTA', label: '(IDJKT) -- JAKARTA' },
  { code: 'MYPEN', name: 'PENANG MALAYSIA', label: '(MYPEN) -- PENANG MALAYSIA' },
  { code: 'PLGDY', name: 'GDYNIA', label: '(PLGDY) -- GDYNIA' },
  { code: 'GBFXT', name: 'FELIXSTOWE', label: '(GBFXT) -- FELIXSTOWE' },
  { code: 'TRIZM', name: 'IZMIR', label: '(TRIZM) -- IZMIR' },
  { code: 'CNXIN', name: 'XIAOLAN', label: '(CNXIN) -- XIAOLAN' },
  { code: 'CNHUA', name: 'HUANGPU', label: '(CNHUA) -- HUANGPU' },
  { code: 'USSAV', name: 'SAVANNAH', label: '(USSAV) -- SAVANNAH' },
  { code: 'CNZSN', name: 'ZHONGSHAN', label: '(CNZSN) -- ZHONGSHAN' },
  { code: 'CNYQS', name: 'BEIJIAO', label: '(CNYQS) -- BEIJIAO' },
  { code: 'MYTPP', name: 'TANJUNG PELEPAS', label: '(MYTPP) -- TANJUNG PELEPAS' },
  { code: 'CNNSA', name: 'NANSHA', label: '(CNNSA) -- NANSHA' },
  { code: 'CNZHA', name: 'ZHANJIANG', label: '(CNZHA) -- ZHANJIANG' },
  { code: 'CNROQ', name: 'RONGQI', label: '(CNROQ) -- RONGQI' },
  { code: 'ITVCE', name: 'VENEZIA', label: '(ITVCE) -- VENEZIA' },
  { code: 'CNTAO', name: 'QINGDAO', label: '(CNTAO) -- QINGDAO' },
  { code: 'VNHPH', name: 'HAIPHONG', label: '(VNHPH) -- HAIPHONG' },
  { code: 'VNHAN', name: 'HANOI', label: '(VNHAN) -- HANOI' },
  { code: 'CNXGG', name: 'XINGANG', label: '(CNXGG) -- XINGANG' },
  { code: 'ITGOA', name: 'GENOA', label: '(ITGOA) -- GENOA' },
  { code: 'CNSHK', name: 'SHEKOU', label: '(CNSHK) -- SHEKOU' },
  { code: 'HKHKG', name: 'HONG KONG', label: '(HKHKG) -- HONG KONG' },
  { code: 'VNSGN', name: 'HO CHI MINH CITY', label: '(VNSGN) -- HO CHI MINH CITY' },
  { code: 'THLCH', name: 'LAEM CHABANG THAILAND', label: '(THLCH) -- LAEM CHABANG THAILAND' },
  { code: 'NLRTM', name: 'ROTTERDAM NETHERLAND', label: '(NLRTM) -- ROTTERDAM NETHERLAND' },
  { code: 'CNNGB', name: 'NINGBO', label: '(CNNGB) -- NINGBO' },
  { code: 'USNYK', name: 'NEW YORK', label: '(USNYK) -- NEW YORK' },
  { code: 'ITBSN', name: 'BUSANA', label: '(ITBSN) -- BUSANA' },
  { code: 'CNXMN', name: 'XIAMEN', label: '(CNXMN) -- XIAMEN' },
  { code: 'TRGEM', name: 'GEMLIK TURKEY', label: '(TRGEM) -- GEMLIK TURKEY' },
  { code: 'SGSIN', name: 'SINGAPORE', label: '(SGSIN) -- SINGAPORE' },
  { code: 'KRPUS', name: 'BUSAN KOREA', label: '(KRPUS) -- BUSAN KOREA' },
  { code: 'CNYTN', name: 'YANTIAN', label: '(CNYTN) -- YANTIAN' },
  { code: 'MYKEL', name: 'KELANG MALAYSIA', label: '(MYKEL) -- KELANG MALAYSIA' },
  { code: 'MYPKG', name: 'PORT KLANG MALAYSIA', label: '(MYPKG) -- PORT KLANG MALAYSIA' },
];

// Delivery port options
const DELIVERY_PORT_OPTIONS = [
  { code: 'INSPE6', name: 'APACHE SEZ', label: '(INSPE6) -- APACHE SEZ' },
  { code: 'INVGR6', name: 'ICD VIRAMGAM', label: '(INVGR6) -- ICD VIRAMGAM' },
  { code: 'INVRM6', name: 'ICD VARNAMA', label: '(INVRM6) -- ICD VARNAMA' },
  { code: 'INPJN6', name: 'JNPA SEZ', label: '(INPJN6) -- JNPA SEZ' },
  { code: 'INLPS6', name: 'DSIL SEZ/RANGA', label: '(INLPS6) -- DSIL SEZ/RANGA' },
  { code: 'INDLB6', name: 'DAULATABAD ICD', label: '(INDLB6) -- DAULATABAD ICD' },
  { code: 'INGRW6', name: 'CHAKAN', label: '(INGRW6) -- CHAKAN' },
  { code: 'INSBK6', name: 'SEZ', label: '(INSBK6) -- SEZ' },
  { code: 'INRUG6', name: 'ICD BARHI', label: '(INRUG6) -- ICD BARHI' },
  { code: 'INHST6', name: 'KIADB SEZ', label: '(INHST6) -- KIADB SEZ' },
  { code: 'NPBRG', name: 'BIRGANJ NEPAL', label: '(NPBRG) -- BIRGANJ NEPAL' },
  { code: 'INAKR6', name: 'SEZ/VISAKHAPATN', label: '(INAKR6) -- SEZ/VISAKHAPATN' },
  { code: 'INTMI6', name: 'IFFCO KISAN SEZ', label: '(INTMI6) -- IFFCO KISAN SEZ' },
  { code: 'SGSIN', name: 'SINGAPORE', label: '(SGSIN) -- SINGAPORE' },
  { code: 'INKQZ6', name: 'SATTVA BLR ICD', label: '(INKQZ6) -- SATTVA BLR ICD' },
  { code: 'INPNQ6', name: 'HADAPSAR SEZ PUNE', label: '(INPNQ6) -- HADAPSAR SEZ PUNE' },
  { code: 'INNPK6', name: 'NANDIAMBAKKAM', label: '(INNPK6) -- NANDIAMBAKKAM' },
  { code: 'INCJS6', name: 'SEZ SIPCOT HI', label: '(INCJS6) -- SEZ SIPCOT HI' },
  { code: 'INVZM6', name: 'VIZAG SEZ', label: '(INVZM6) -- VIZAG SEZ' },
  { code: 'INCJD6', name: 'DLF INFO CITY', label: '(INCJD6) -- DLF INFO CITY' },
  { code: 'INVLR6', name: 'SIPC SEZ VELLORE', label: '(INVLR6) -- SIPC SEZ VELLORE' },
  { code: 'INJHV6', name: 'VISHAKHAPATNAM', label: '(INJHV6) -- VISHAKHAPATNAM' },
  { code: 'INVZR6', name: 'REDDY-R-SEZ', label: '(INVZR6) -- REDDY-R-SEZ' },
  { code: 'BTTHI', name: 'BHUTAN THIMPU', label: '(BTTHI) -- BHUTAN THIMPU' },
  { code: 'INCOK6', name: 'COCHIN EPZ/SEZ', label: '(INCOK6) -- COCHIN EPZ/SEZ' },
  { code: 'INTEN6', name: 'SIPCOT SEZ', label: '(INTEN6) -- SIPCOT SEZ' },
  { code: 'INGLY6', name: 'APIICL SEZ', label: '(INGLY6) -- APIICL SEZ' },
  { code: 'INSBC6', name: 'BIOCON SEZ', label: '(INSBC6) -- BIOCON SEZ' },
  { code: 'INGNC6', name: 'GIFT SEZ LTD', label: '(INGNC6) -- GIFT SEZ LTD' },
  { code: 'INQRP6', name: 'ICD KILA RAIPUR', label: '(INQRP6) -- ICD KILA RAIPUR' },
  { code: 'INPUI6', name: 'SEZ KRC INFRAS', label: '(INPUI6) -- SEZ KRC INFRAS' },
  { code: 'INGIN6', name: 'KANDLA', label: '(INGIN6) -- KANDLA' },
  { code: 'INLPB6', name: 'HYDERABAD SEZ', label: '(INLPB6) -- HYDERABAD SEZ' },
  { code: 'INPAO6', name: 'SEZ PANOLI', label: '(INPAO6) -- SEZ PANOLI' },
  { code: 'INQRH6', name: 'ICD KILA RAIPUR', label: '(INQRH6) -- ICD KILA RAIPUR' },
  { code: 'INBHD6', name: 'DAHEJ SEZ', label: '(INBHD6) -- DAHEJ SEZ' },
  { code: 'INKPK6', name: 'ICD MIHAN', label: '(INKPK6) -- ICD MIHAN' },
  { code: 'INMUZ6', name: 'MODINAGAR', label: '(INMUZ6) -- MODINAGAR' },
  { code: 'INMAA6', name: 'MEPZ SEZ', label: '(INMAA6) -- MEPZ SEZ' },
  { code: 'INRML6', name: 'NAYA RAIPUR CON', label: '(INRML6) -- NAYA RAIPUR CON' },
  { code: 'INKZT6', name: 'ELECTRONICS SEZ', label: '(INKZT6) -- ELECTRONICS SEZ' },
  { code: 'INNYP6', name: 'NAIDUPET SEZ', label: '(INNYP6) -- NAIDUPET SEZ' },
  { code: 'INKJR6', name: 'MANAHATTAN SEZ', label: '(INKJR6) -- MANAHATTAN SEZ' },
  { code: 'INPNU6', name: 'MANJRI STUD', label: '(INPNU6) -- MANJRI STUD' },
  { code: 'INPNB6', name: 'SEZ PUNE', label: '(INPNB6) -- SEZ PUNE' },
  { code: 'INUDI6', name: 'ASPEN SEZ', label: '(INUDI6) -- ASPEN SEZ' },
  { code: 'INAWM6', name: 'AURANGABAD', label: '(INAWM6) -- AURANGABAD' },
  { code: 'INBNX6', name: 'CANDOR KOLKATA', label: '(INBNX6) -- CANDOR KOLKATA' },
  { code: 'INNDA6', name: 'NOIDA SEZ', label: '(INNDA6) -- NOIDA SEZ' },
  { code: 'INSCH6', name: 'SAP-SEZ SURAT', label: '(INSCH6) -- SAP-SEZ SURAT' },
  { code: 'INSJR6', name: 'ICD SURAJPUR', label: '(INSJR6) -- ICD SURAJPUR' },
  { code: 'NLRTM', name: 'ROTTERDAM', label: '(NLRTM) -- ROTTERDAM' },
  { code: 'INPUE6', name: 'EON2', label: '(INPUE6) -- EON2' },
  { code: 'INVTZ6', name: 'VISHAKHAPATNAM SEZ', label: '(INVTZ6) -- VISHAKHAPATNAM SEZ' },
  { code: 'INHEM6', name: 'MANYATA EBP SEZ', label: '(INHEM6) -- MANYATA EBP SEZ' },
  { code: 'INBMA6', name: 'SEZ', label: '(INBMA6) -- SEZ' },
  { code: 'INCGL6', name: 'MWCDL AUTO ANCILLARIES', label: '(INCGL6) -- MWCDL AUTO ANCILLARIES' },
  { code: 'INTAS6', name: 'SRICITY SEZ', label: '(INTAS6) -- SRICITY SEZ' },
  { code: 'INGGU6', name: 'UNITECH REALITY PROJECTS', label: '(INGGU6) -- UNITECH REALITY PROJECTS' },
  { code: 'INCCP6', name: 'PUNE EMBASSY PROJECT', label: '(INCCP6) -- PUNE EMBASSY PROJECT' },
  { code: 'INAIG6', name: 'GIGAPLEX ESTATE PVT LTD', label: '(INAIG6) -- GIGAPLEX ESTATE PVT LTD' },
  { code: 'INIDR6', name: 'VAISHNAV YARD', label: '(INIDR6) -- VAISHNAV YARD' },
  { code: 'INCGA6', name: 'MAHINDRA WORLD CITY', label: '(INCGA6) -- MAHINDRA WORLD CITY' },
  { code: 'BTPBH', name: 'BHUTAN', label: '(BTPBH) -- BHUTAN' },
  { code: 'INSTV6', name: 'SEZ SACHIN SURAT', label: '(INSTV6) -- SEZ SACHIN SURAT' },
  { code: 'INNSA1', name: 'NHAVA SHEVA (NSICT)', label: '(INNSA1) -- NHAVA SHEVA (NSICT)' },
  { code: 'INNSA2', name: 'NHAVA SHEVA (GTI)', label: '(INNSA2) -- NHAVA SHEVA (GTI)' },
  { code: 'INNSA3', name: 'NHAVA SHEVA (BMCT)', label: '(INNSA3) -- NHAVA SHEVA (BMCT)' },
  { code: 'INBOM4', name: 'NHAVA SHEVA (JNPT)', label: '(INBOM4) -- NHAVA SHEVA (JNPT)' },
  { code: 'INMUN1', name: 'MUMBAI SEA', label: '(INMUN1) -- MUMBAI SEA' },
  { code: 'INMAA1', name: 'CHENNAI SEA', label: '(INMAA1) -- CHENNAI SEA' },
  { code: 'INKOK1', name: 'KOCHI SEA', label: '(INKOK1) -- KOCHI SEA' },
  { code: 'INKOK4', name: 'KOCHI SEA (INTERNATIONAL)', label: '(INKOK4) -- KOCHI SEA (INTERNATIONAL)' },
  { code: 'INTUT1', name: 'TUTICORIN SEA', label: '(INTUT1) -- TUTICORIN SEA' },
  { code: 'INVTZ1', name: 'VISAKHAPATNAM SEA', label: '(INVTZ1) -- VISAKHAPATNAM SEA' },
  { code: 'INCCU1', name: 'KOLKATA SEA', label: '(INCCU1) -- KOLKATA SEA' },
  { code: 'INPAV1', name: 'PIPAVAV PORT', label: '(INPAV1) -- PIPAVAV PORT' },
  { code: 'INHZA1', name: 'HAZIRA PORT', label: '(INHZA1) -- HAZIRA PORT' },
  { code: 'INSUR6', name: 'SURAT ICD', label: '(INSUR6) -- SURAT ICD' },
  { code: 'INLUD6', name: 'LUDHIANA ICD', label: '(INLUD6) -- LUDHIANA ICD' },
  { code: 'INAMD6', name: 'AHMEDABAD ICD', label: '(INAMD6) -- AHMEDABAD ICD' },
  { code: 'INBMT6', name: 'BANGALORE ICD', label: '(INBMT6) -- BANGALORE ICD' },
  { code: 'INHYD4', name: 'HYDERABAD ICD', label: '(INHYD4) -- HYDERABAD ICD' },
  { code: 'INDEL4', name: 'DELHI ICD (TUGHLAKABAD)', label: '(INDEL4) -- DELHI ICD (TUGHLAKABAD)' },
  { code: 'INDEL6', name: 'DELHI ICD (PATPARGANJ)', label: '(INDEL6) -- DELHI ICD (PATPARGANJ)' },
  { code: 'INPNQ1', name: 'PUNE ICD', label: '(INPNQ1) -- PUNE ICD' },
  { code: 'INJPR6', name: 'JAIPUR ICD', label: '(INJPR6) -- JAIPUR ICD' },
  { code: 'INNAG6', name: 'NAGPUR ICD', label: '(INNAG6) -- NAGPUR ICD' },
  { code: 'INKAN6', name: 'KANPUR ICD', label: '(INKAN6) -- KANPUR ICD' },
  { code: 'INMOR6', name: 'MORADABAD ICD', label: '(INMOR6) -- MORADABAD ICD' },
  { code: 'INGKP6', name: 'GORAKHPUR ICD', label: '(INGKP6) -- GORAKHPUR ICD' },
];

type PortOption = { code: string; name: string; label: string };

// Searchable port autocomplete component
const PortSearch: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: PortOption[];
  placeholder?: string;
}> = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    if (!value) return options.slice(0, 15);
    const q = value.toUpperCase();
    return options.filter(
      (o) => o.code.toUpperCase().includes(q) || o.name.toUpperCase().includes(q)
    ).slice(0, 20);
  }, [value, options]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-control"
        value={value}
        placeholder={placeholder || 'Type to search port...'}
        onChange={(e) => { onChange(e.target.value.toUpperCase()); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #d4dbff', borderRadius: 6,
          maxHeight: 220, overflowY: 'auto', zIndex: 2000,
          boxShadow: '0 4px 20px rgba(24,64,242,0.13)',
        }}>
          {filtered.map((o) => (
            <div
              key={o.code + o.label}
              style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f0f4ff' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.label); setOpen(false); }}
            >
              <strong style={{ color: '#1a3fbf' }}>{o.code}</strong>
              <span style={{ color: '#555', marginLeft: 8 }}>{o.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ImporterOption {
  id: string;
  importer_name: string;
  address1: string;
  address2: string;
  address3: string;
}

const ImporterSearch: React.FC<{
  value: string;
  onChange: (name: string) => void;
  onSelect: (name: string, addr1: string, addr2: string, addr3: string) => void;
}> = ({ value, onChange, onSelect }) => {
  const [options, setOptions] = useState<ImporterOption[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value || value.length < 2) { setOptions([]); setOpen(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/sea-importers', { params: { q: value } });
        const data: ImporterOption[] = res.data || [];
        setOptions(data);
        if (data.length > 0) setOpen(true);
      } catch {
        setOptions([]);
      }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <textarea
        className="form-control"
        style={{ minHeight: 70 }}
        maxLength={35}
        value={value}
        onChange={(e) => { onChange(e.target.value.toUpperCase()); setOpen(true); }}
        onFocus={() => { if (options.length > 0) setOpen(true); }}
      />
      {open && options.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
          border: '1px solid #d4dbff', borderRadius: 6, maxHeight: 220, overflowY: 'auto',
          zIndex: 3000, boxShadow: '0 4px 20px rgba(24,64,242,0.13)',
        }}>
          {options.map((opt) => (
            <div
              key={opt.id}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f4ff' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(opt.importer_name, opt.address1 || '', opt.address2 || '', opt.address3 || '');
                setOpen(false);
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.importer_name}</div>
              {(opt.address1 || opt.address2 || opt.address3) && (
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                  {[opt.address1, opt.address2, opt.address3].filter(Boolean).join(' | ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Container number: 4 alpha + 7 numeric, auto-format as user types
const formatContainerNo = (raw: string): string => {
  const upper = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let result = '';
  let alphaCount = 0;
  let numCount = 0;
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (alphaCount < 4) {
      if (/[A-Z]/.test(ch)) { result += ch; alphaCount++; }
    } else if (numCount < 7) {
      if (/[0-9]/.test(ch)) { result += ch; numCount++; }
    }
  }
  return result;
};

const isValidContainerNo = (val: string): boolean => /^[A-Z]{4}\d{7}$/.test(val);

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const emptyContainer = (): SeaContainerRow => ({
  container_no: '',
  seal_no: '',
  package_count: '',
  weight: '',
  container_size: '',
  container_type: 'FCL',
  soc_flag: 'N-NO',
  agent_code: '',
});

const createHblRow = (index = 0): SeaHblForm => ({
  hbl_no: '',
  hbl_date: today(),
  package_count: '',
  package_type: 'PKG',
  gross_weight: '',
  cargo_nature: 'C-Containerized',
  item_type: 'OT-Other Cargo',
  cargo_move: 'TI-ICD Transhipment',
  port_of_delivery: '',
  dest_cfs: '',
  subline_no: String(index + 1),
  importer_name: '',
  importer_address1: '',
  importer_address2: '',
  importer_address3: '',
  cargo_description: '',
  marks_numbers: 'NM',
  carrier_name: '',
  carrier_code: '',
  bond_no: '',
  transport: '',
  mlo_name: '',
  mlo_code: '',
  containers: [emptyContainer()],
  cargo_net_weight: '',
  volume_cbm: '',
  hs_code: '',
  imo_code: '',
  invoice_value_currency: 'INR',
});

const createMblForm = (locationCode = '', profileId = ''): SeaMblForm => ({
  mbl_no: '',
  mbl_date: today(),
  port_of_loading: '',
  vessel_date: '',
  igm_no: '',
  igm_date: '',
  vessel_code: '',
  imo_code: '',
  vessel_voyage_no: '',
  line_no: '',
  vessel_name: '',
  shipping_line: '',
  description: '',
  customs_house_code: locationCode,
  profile_id: profileId,
  total_packages: '0',
  total_gross_weight: '0',
  total_volume_cbm: '0',
  port_of_unloading: locationCode ? locationCode : '',
  cargo_move: '',
  port_of_delivery: '',
  dest_cfs: '',
  subline_no: '1',
  cargo_nature: 'C-Containerized',
  item_type: 'OT-Other Cargo',
  importer_name: '',
  importer_address1: '',
  importer_address2: '',
  importer_address3: '',
  marks_numbers: 'NM',
  transport: '',
  bond_no: '',
  carrier_name: '',
  carrier_code: '',
  mlo_name: '',
  mlo_code: '',
});

const mapHblRecordToForm = (row: any, fallbackMbl?: any): SeaHblForm => ({
  hbl_no: row.hbl_no || '',
  hbl_date: row.hbl_date?.slice(0, 10) || today(),
  package_count: String(row.package_count ?? ''),
  package_type: row.package_type || 'PKG',
  gross_weight: String(row.gross_weight ?? ''),
  cargo_nature: row.cargo_nature || fallbackMbl?.cargo_nature || 'C-Containerized',
  item_type: row.item_type || fallbackMbl?.item_type || 'OT-Other Cargo',
  cargo_move: row.cargo_move || fallbackMbl?.cargo_move || 'TI-ICD Transhipment',
  port_of_delivery: row.port_of_delivery || fallbackMbl?.port_of_delivery || '',
  dest_cfs: row.dest_cfs || fallbackMbl?.dest_cfs || '',
  subline_no: row.subline_no || '',
  importer_name: row.importer_name || fallbackMbl?.importer_name || '',
  importer_address1: row.importer_address1 || fallbackMbl?.importer_address1 || '',
  importer_address2: row.importer_address2 || fallbackMbl?.importer_address2 || '',
  importer_address3: row.importer_address3 || fallbackMbl?.importer_address3 || '',
  cargo_description: row.cargo_description || '',
  marks_numbers: row.marks_numbers || 'NM',
  carrier_name: row.carrier_name || fallbackMbl?.carrier_name || '',
  carrier_code: row.carrier_code || fallbackMbl?.carrier_code || '',
  bond_no: row.bond_no || fallbackMbl?.bond_no || '',
  transport: row.transport || fallbackMbl?.transport || '',
  mlo_name: row.mlo_name || fallbackMbl?.mlo_name || '',
  mlo_code: row.mlo_code || fallbackMbl?.mlo_code || '',
  containers: (() => {
    if (Array.isArray(row.containers_json) && row.containers_json.length > 0) {
      return row.containers_json.map((c: any) => ({
        container_no: c.container_no || '',
        seal_no: c.seal_no || '',
        package_count: String(c.package_count ?? ''),
        weight: String(c.weight ?? ''),
        container_size: c.container_size || '',
        container_type: c.container_type || 'FCL',
        soc_flag: c.soc_flag || 'N-NO',
        agent_code: c.agent_code || '',
      }));
    }
    return [{
      container_no: row.container_no || '',
      seal_no: row.seal_no || '',
      package_count: '',
      weight: '',
      container_size: row.container_size || '',
      container_type: row.container_type || 'FCL',
      soc_flag: row.soc_flag || 'N-NO',
      agent_code: row.agent_code || '',
    }];
  })(),
  cargo_net_weight: String(row.cargo_net_weight ?? ''),
  volume_cbm: String(row.volume_cbm ?? ''),
  hs_code: row.hs_code || '',
  imo_code: row.imo_code || '',
  invoice_value_currency: row.invoice_value_currency || 'INR',
});

const SeaConsolePage: React.FC = () => {
  const { selectedLocation, user } = useAuth();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  const [mbls, setMbls] = useState<SeaMblRecord[]>([]);
  const [history, setHistory] = useState<SeaTransmissionRecord[]>([]);
  const [selectedMblId, setSelectedMblId] = useState<string | null>(null);
  const [form, setForm] = useState<SeaMblForm>(createMblForm());
  const [hbls, setHbls] = useState<SeaHblForm[]>([createHblRow(0)]);
  const [activeHblTab, setActiveHblTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [carriers, setCarriers] = useState<SeaCarrierRecord[]>([]);
  const [mlos, setMlos] = useState<SeaMloRecord[]>([]);

  useEffect(() => {
    api.get('/sea-carriers').then((r) => setCarriers(r.data || [])).catch(() => {});
    api.get('/sea-mlos').then((r) => setMlos(r.data || [])).catch(() => {});
  }, []);

  const resetEditor = useCallback(() => {
    setSelectedMblId(null);
    setForm(createMblForm(
      selectedLocation?.customs_house_code || user?.customs_house_code || '',
      user?.profile_id || ''
    ));
    setHbls([createHblRow(0)]);
    setActiveHblTab(0);
  }, [selectedLocation?.customs_house_code, user?.customs_house_code, user?.profile_id]);

  const applyRecord = useCallback((record: SeaMblRecord) => {
    setSelectedMblId(record.id);
    setForm({
      mbl_no: record.mbl_no || '',
      mbl_date: record.mbl_date?.slice(0, 10) || today(),
      port_of_loading: record.port_of_loading || '',
      vessel_date: record.vessel_date?.slice(0, 10) || '',
      igm_no: record.igm_no || '',
      igm_date: record.igm_date?.slice(0, 10) || '',
      vessel_code: record.vessel_code || '',
      imo_code: record.imo_code || '',
      vessel_voyage_no: record.vessel_voyage_no || '',
      line_no: record.line_no || '',
      vessel_name: record.vessel_name || '',
      shipping_line: record.shipping_line || '',
      description: record.description || '',
      customs_house_code: record.customs_house_code || selectedLocation?.customs_house_code || '',
      profile_id: record.profile_id || user?.profile_id || '',
      total_packages: String(record.total_packages ?? '0'),
      total_gross_weight: String(record.total_gross_weight ?? '0'),
      total_volume_cbm: String(record.total_volume_cbm ?? '0'),
      port_of_unloading: record.port_of_unloading || '',
      cargo_move: record.cargo_move || '',
      port_of_delivery: record.port_of_delivery || '',
      dest_cfs: record.dest_cfs || '',
      subline_no: record.subline_no || '1',
      cargo_nature: record.cargo_nature || 'C-Containerized',
      item_type: record.item_type || 'OT-Other Cargo',
      importer_name: record.importer_name || '',
      importer_address1: record.importer_address1 || '',
      importer_address2: record.importer_address2 || '',
      importer_address3: record.importer_address3 || '',
      marks_numbers: record.marks_numbers || 'NM',
      transport: record.transport || '',
      bond_no: record.bond_no || '',
      carrier_name: record.carrier_name || '',
      carrier_code: record.carrier_code || '',
      mlo_name: record.mlo_name || '',
      mlo_code: record.mlo_code || '',
    });
    const mappedHbls = record.hbls && record.hbls.length > 0
      ? record.hbls.map((h, i) => mapHblRecordToForm(
          { ...h, subline_no: h.subline_no || String(i + 1) },
          record
        ))
      : [createHblRow(0)];
    setHbls(mappedHbls);
    setActiveHblTab(0);
  }, [selectedLocation?.customs_house_code, user?.profile_id]);

  const fetchMbls = useCallback(async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const response = await api.get('/sea-mbls', {
        params: {
          page: nextPage,
          pageSize: nextPageSize,
          ...(search ? { search } : {}),
          ...(selectedLocation?.customs_house_code ? { customs_house_code: selectedLocation.customs_house_code } : {}),
        },
      });
      setMbls(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch {
      toast.error('Failed to load MBL records');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, selectedLocation?.customs_house_code]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get('/sea-transmissions');
      setHistory((response.data || []).slice(0, 6));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => { fetchMbls(page, pageSize); }, [fetchMbls, page, pageSize]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => { if (!selectedMblId) resetEditor(); }, [resetEditor, selectedMblId]);

  useEffect(() => {
    const editMblId = (routerLocation.state as any)?.editMblId;
    if (editMblId) {
      loadDetail(editMblId);
      window.history.replaceState({}, '');
    }
  }, [routerLocation.state]);

  const loadDetail = async (id: string) => {
    try {
      const response = await api.get(`/sea-mbls/${id}`);
      applyRecord(response.data);
    } catch {
      toast.error('Failed to load MBL details');
    }
  };

  const updateForm = (field: keyof SeaMblForm, value: string) =>
    setForm((c) => ({ ...c, [field]: value }));

  const updateHbl = (index: number, field: keyof SeaHblForm, value: string) =>
    setHbls((c) => c.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const updateContainer = (hblIndex: number, containerIndex: number, field: keyof SeaContainerRow, value: string) =>
    setHbls((c) => c.map((row, i) => {
      if (i !== hblIndex) return row;
      const containers = row.containers.map((ct, ci) => ci === containerIndex ? { ...ct, [field]: value } : ct);
      return { ...row, containers };
    }));

  const addContainer = (hblIndex: number) =>
    setHbls((c) => c.map((row, i) => {
      if (i !== hblIndex) return row;
      return { ...row, containers: [...row.containers, emptyContainer()] };
    }));

  const removeContainer = (hblIndex: number, containerIndex: number) =>
    setHbls((c) => c.map((row, i) => {
      if (i !== hblIndex) return row;
      if (row.containers.length <= 1) return row;
      return { ...row, containers: row.containers.filter((_, ci) => ci !== containerIndex) };
    }));

  const addHbl = () => {
    const newIndex = hbls.length;
    setHbls((c) => [...c, createHblRow(newIndex)]);
    setActiveHblTab(newIndex);
  };

  const deleteHbl = (index: number) => {
    if (hbls.length === 1) {
      setHbls([createHblRow(0)]);
      return;
    }
    const updated = hbls
      .filter((_, i) => i !== index)
      .map((h, i) => ({ ...h, subline_no: String(i + 1) }));
    setHbls(updated);
    setActiveHblTab(Math.min(index, updated.length - 1));
  };

  const validateForm = () => {
    if (!form.mbl_no.trim()) { toast.error('MBL number is required'); return false; }
    const seen = new Set<string>();
    for (let i = 0; i < hbls.length; i++) {
      const hblNo = hbls[i].hbl_no.trim().toUpperCase();
      if (!hblNo) { toast.error(`HBL number is required on HBL ${i + 1}`); return false; }
      if (seen.has(hblNo)) { toast.error(`Duplicate HBL number: ${hblNo}`); return false; }
      seen.add(hblNo);
      // Validate container numbers
      for (let ci = 0; ci < hbls[i].containers.length; ci++) {
        const ct = hbls[i].containers[ci];
        if (ct.container_no && !isValidContainerNo(ct.container_no)) {
          toast.error(`HBL ${i + 1}, Container ${ci + 1}: Number must be 4 letters + 7 digits (e.g. ABCD1234567)`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        customs_house_code: form.customs_house_code || selectedLocation?.customs_house_code || user?.customs_house_code || '',
        profile_id: form.profile_id || user?.profile_id || '',
        hbls,
      };
      const response = selectedMblId
        ? await api.put(`/sea-mbls/${selectedMblId}`, payload)
        : await api.post('/sea-mbls', payload);
      applyRecord(response.data);
      await fetchMbls(1, pageSize);
      await fetchHistory();
      setPage(1);
      toast.success(selectedMblId ? 'MBL updated' : 'MBL created');
      // Auto-save unique importer name+address combinations to the importer master
      const seen = new Set<string>();
      for (const hbl of hbls) {
        if (hbl.importer_name.trim()) {
          const key = `${hbl.importer_name}|${hbl.importer_address1}|${hbl.importer_address2}|${hbl.importer_address3}`;
          if (!seen.has(key)) {
            seen.add(key);
            api.post('/sea-importers', {
              importer_name: hbl.importer_name.trim(),
              address1: hbl.importer_address1.trim(),
              address2: hbl.importer_address2.trim(),
              address3: hbl.importer_address3.trim(),
            }).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMblId) { toast.error('Select an MBL first'); return; }
    if (!window.confirm(`Delete ${form.mbl_no}?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/sea-mbls/${selectedMblId}`);
      toast.success('MBL deleted');
      resetEditor();
      await fetchMbls(1, pageSize);
      setPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleRowDelete = async (record: SeaMblRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete MBL ${record.mbl_no}? This will also delete all its HBLs.`)) return;
    try {
      await api.delete(`/sea-mbls/${record.id}`);
      toast.success(`MBL ${record.mbl_no} deleted`);
      if (selectedMblId === record.id) resetEditor();
      await fetchMbls(1, pageSize);
      setPage(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleGenerate = async () => {
    if (!selectedMblId) { toast.error('Save or select an MBL first'); return; }
    setGenerating(true);
    try {
      const response = await api.post(`/sea-transmissions/generate/${selectedMblId}`, {});
      const blob = new Blob([response.data.fileContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded: ${response.data.fileName}`);
      await fetchHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const activeHbl = hbls[activeHblTab];

  return (
    <div className="page-container entry-form-page">

      {/* â”€â”€ Top action bar â”€â”€ */}
      <div className="ef-topbar">
        <div className="ef-topbar-title">
          {selectedMblId ? `Editing: ${form.mbl_no}` : 'New Sea Entry'}
        </div>
        <div className="ef-topbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={resetEditor}>New Entry</button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleGenerate}
            disabled={!selectedMblId || generating}
          >
            {generating ? 'Preparingâ€¦' : 'Generate CGM File'}
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={!selectedMblId || deleting}
          >
            {deleting ? 'Deletingâ€¦' : 'Delete'}
          </button>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ENTRY FORM â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="ef-form-wrap">

        {/* â”€â”€ MBL Details â”€â”€ */}
        <div className="ef-section">
          <div className="ef-section-title">MBL Details</div>

          <div className="form-row form-row-4">
            <div className="form-group ef-req">
              <label className="form-label">MBL No.</label>
              <input
                className="form-control font-mono"
                value={form.mbl_no}
                onChange={(e) => updateForm('mbl_no', e.target.value.toUpperCase())}
                placeholder="MBLXXXXXXXXX"
              />
            </div>
            <div className="form-group ef-req">
              <label className="form-label">MBL Date</label>
              <input
                className="form-control"
                type="date"
                value={form.mbl_date}
                onChange={(e) => updateForm('mbl_date', e.target.value)}
              />
            </div>
            <div className="form-group ef-req">
              <label className="form-label">Loading Port</label>
              <PortSearch
                value={form.port_of_loading}
                onChange={(v) => updateForm('port_of_loading', v)}
                options={LOADING_PORT_OPTIONS}
                placeholder="Type to search loading port..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vessel Date</label>
              <input
                className="form-control"
                type="date"
                value={form.vessel_date}
                onChange={(e) => updateForm('vessel_date', e.target.value)}
              />
            </div>
          </div>

          {/* IGM / Vessel fields â€” can be filled later, not required on first save */}
          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">IGM No. <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.igm_no}
                onChange={(e) => updateForm('igm_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IGM Date <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                type="date"
                value={form.igm_date}
                onChange={(e) => updateForm('igm_date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vessel Code <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.vessel_code}
                onChange={(e) => updateForm('vessel_code', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">IMO Code <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.imo_code}
                onChange={(e) => updateForm('imo_code', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="form-row form-row-4">
            <div className="form-group">
              <label className="form-label">Voyage No. <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.vessel_voyage_no}
                onChange={(e) => updateForm('vessel_voyage_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Line No. <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}>(fill later)</span></label>
              <input
                className="form-control"
                value={form.line_no}
                onChange={(e) => updateForm('line_no', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vessel Name</label>
              <input
                className="form-control"
                value={form.vessel_name}
                onChange={(e) => updateForm('vessel_name', e.target.value.toUpperCase())}
              />
            </div>
            <div className="form-group ef-req">
              <label className="form-label">Shipping Line</label>
              <input
                className="form-control"
                value={form.shipping_line}
                onChange={(e) => updateForm('shipping_line', e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group ef-req">
              <label className="form-label">Remarks</label>
              <input
                className="form-control"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </div>

        <div className="ef-divider" />

        {/* â”€â”€ HBL Details â”€â”€ */}
        <div className="ef-section">
          <div className="ef-section-header">
            <div className="ef-section-title">HBL Details</div>
            <button className="btn btn-primary btn-sm" onClick={addHbl}>Add HBL</button>
          </div>

          {/* Tab bar */}
          <div className="tab-bar ef-hbl-tabs">
            {hbls.map((_, i) => (
              <button
                key={i}
                className={`tab-btn${activeHblTab === i ? ' active' : ''}`}
                onClick={() => setActiveHblTab(i)}
              >
                HBL {i + 1}
              </button>
            ))}
          </div>

          {activeHbl && (
            <div className="ef-hbl-body">
              {/* Delete HBL */}
              <div className="ef-hbl-delete-row">
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => deleteHbl(activeHblTab)}
                >
                  Delete HBL
                </button>
              </div>

              {/* Row 1: Cargo Move, Port of Delivery, Dest CFS, Subline */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">Cargo Move</label>
                  <select
                    className="form-control"
                    value={activeHbl.cargo_move}
                    onChange={(e) => updateHbl(activeHblTab, 'cargo_move', e.target.value)}
                  >
                    {CARGO_MOVE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Port of Delivery</label>
                  <PortSearch
                    value={activeHbl.port_of_delivery}
                    onChange={(v) => updateHbl(activeHblTab, 'port_of_delivery', v)}
                    options={DELIVERY_PORT_OPTIONS}
                    placeholder="Type to search delivery port..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dest(CFS)</label>
                  <input
                    className="form-control"
                    value={activeHbl.dest_cfs}
                    onChange={(e) => updateHbl(activeHblTab, 'dest_cfs', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Subline No.</label>
                  <input
                    className="form-control"
                    value={activeHbl.subline_no}
                    readOnly
                    style={{ background: '#f3f6fd', color: '#66718f', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* Row 2: HBL No, HBL Date, Package, Package Code */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">HBL No.</label>
                  <input
                    className="form-control font-mono"
                    value={activeHbl.hbl_no}
                    onChange={(e) => updateHbl(activeHblTab, 'hbl_no', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">HBL Date</label>
                  <input
                    className="form-control"
                    type="date"
                    value={activeHbl.hbl_date}
                    onChange={(e) => updateHbl(activeHblTab, 'hbl_date', e.target.value)}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Package</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    value={activeHbl.package_count}
                    onChange={(e) => updateHbl(activeHblTab, 'package_count', e.target.value)}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Package Code</label>
                  <select
                    className="form-control"
                    value={activeHbl.package_type}
                    onChange={(e) => updateHbl(activeHblTab, 'package_type', e.target.value)}
                  >
                    {PACKAGE_CODE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Weight, Weight Unit, Cargo Nature, Item Type */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">Gross Weight (KGS)</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.001"
                    min="0"
                    value={activeHbl.gross_weight}
                    onChange={(e) => updateHbl(activeHblTab, 'gross_weight', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight Unit</label>
                  <input
                    className="form-control"
                    value="KGS"
                    readOnly
                    style={{ background: '#f3f6fd', color: '#66718f', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Cargo Nature</label>
                  <select
                    className="form-control"
                    value={activeHbl.cargo_nature}
                    onChange={(e) => updateHbl(activeHblTab, 'cargo_nature', e.target.value)}
                  >
                    {CARGO_NATURE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group ef-req">
                  <label className="form-label">Item Type</label>
                  <select
                    className="form-control"
                    value={activeHbl.item_type}
                    onChange={(e) => updateHbl(activeHblTab, 'item_type', e.target.value)}
                  >
                    {ITEM_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: Importer Name + Addresses (35-char limit each) */}
              <div className="form-row form-row-4">
                <div className="form-group ef-req">
                  <label className="form-label">
                    Importer Name
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.importer_name || '').length}/35)
                    </span>
                  </label>
                  <ImporterSearch
                    value={activeHbl.importer_name}
                    onChange={(name) => updateHbl(activeHblTab, 'importer_name', name)}
                    onSelect={(name, addr1, addr2, addr3) => {
                      updateHbl(activeHblTab, 'importer_name', name);
                      updateHbl(activeHblTab, 'importer_address1', addr1);
                      updateHbl(activeHblTab, 'importer_address2', addr2);
                      updateHbl(activeHblTab, 'importer_address3', addr3);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Address 1
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.importer_address1 || '').length}/35)
                    </span>
                  </label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    maxLength={35}
                    value={activeHbl.importer_address1}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_address1', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Address 2
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.importer_address2 || '').length}/35)
                    </span>
                  </label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    maxLength={35}
                    value={activeHbl.importer_address2}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_address2', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Address 3
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.importer_address3 || '').length}/35)
                    </span>
                  </label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 70 }}
                    maxLength={35}
                    value={activeHbl.importer_address3}
                    onChange={(e) => updateHbl(activeHblTab, 'importer_address3', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {/* Row 5: Description (150-char limit), Mark & No, Carrier, Carrier Code */}
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">
                    Description
                    <span style={{ fontSize: 10, color: '#888', marginLeft: 6 }}>
                      ({(activeHbl.cargo_description || '').length}/150)
                    </span>
                  </label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: 60 }}
                    maxLength={150}
                    value={activeHbl.cargo_description}
                    onChange={(e) => updateHbl(activeHblTab, 'cargo_description', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mark &amp; No.</label>
                  <input
                    className="form-control"
                    value={activeHbl.marks_numbers}
                    onChange={(e) => updateHbl(activeHblTab, 'marks_numbers', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Carrier Name</label>
                  <select
                    className="form-control"
                    value={activeHbl.carrier_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const carrier = carriers.find((c) => c.carrier_name === name);
                      updateHbl(activeHblTab, 'carrier_name', name);
                      if (carrier) {
                        updateHbl(activeHblTab, 'carrier_code', carrier.carrier_code || '');
                        if (carrier.bond_number) updateHbl(activeHblTab, 'bond_no', carrier.bond_number);
                        if (carrier.transport) updateHbl(activeHblTab, 'transport', carrier.transport);
                        if (carrier.dest) updateHbl(activeHblTab, 'dest_cfs', carrier.dest);
                      }
                    }}
                  >
                    <option value="">-- Select Carrier --</option>
                    {carriers.map((c) => (
                      <option key={c.id} value={c.carrier_name}>{c.carrier_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Carrier Code</label>
                  <input
                    className="form-control font-mono"
                    value={activeHbl.carrier_code}
                    onChange={(e) => updateHbl(activeHblTab, 'carrier_code', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {/* Row 6: Bond, Transport, MLO Name, MLO Code */}
              <div className="form-row form-row-4">
                <div className="form-group">
                  <label className="form-label">Bond No.</label>
                  <input
                    className="form-control"
                    value={activeHbl.bond_no}
                    onChange={(e) => updateHbl(activeHblTab, 'bond_no', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Transport</label>
                  <input
                    className="form-control"
                    value={activeHbl.transport}
                    onChange={(e) => updateHbl(activeHblTab, 'transport', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">MLO Name</label>
                  <select
                    className="form-control"
                    value={activeHbl.mlo_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const mlo = mlos.find((m) => m.mlo_name === name);
                      const mloCode = mlo?.mlo_code || '';
                      updateHbl(activeHblTab, 'mlo_name', name);
                      if (mlo) {
                        updateHbl(activeHblTab, 'mlo_code', mloCode);
                        if (mloCode) {
                          setHbls((prev) =>
                            prev.map((h, i) =>
                              i !== activeHblTab
                                ? h
                                : {
                                    ...h,
                                    containers: h.containers.map((c) => ({
                                      ...c,
                                      agent_code: mloCode,
                                    })),
                                  }
                            )
                          );
                        }
                      }
                    }}
                  >
                    <option value="">-- Select MLO --</option>
                    {mlos.map((m) => (
                      <option key={m.id} value={m.mlo_name}>{m.mlo_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">MLO Code</label>
                  <input
                    className="form-control font-mono"
                    value={activeHbl.mlo_code}
                    onChange={(e) => updateHbl(activeHblTab, 'mlo_code', e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              {/* â”€â”€ Container Details â”€â”€ */}
              <div className="ef-divider" style={{ margin: '18px 0 14px' }} />
              <div className="ef-section-header" style={{ marginBottom: 10 }}>
                <div className="ef-section-title" style={{ fontSize: 15 }}>
                  Container Details{' '}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>
                    ({activeHbl.containers.length} container{activeHbl.containers.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => addContainer(activeHblTab)}>
                  + Add Container
                </button>
              </div>

              <div className="table-wrapper">
                <table className="ef-container-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Container No. <span style={{ fontSize: 10, fontWeight: 400 }}>(4 alpha+7 num)</span></th>
                      <th>Seal No.</th>
                      <th>Packages</th>
                      <th>Weight (Tons)</th>
                      <th>Container Size</th>
                      <th>Container Status</th>
                      <th>SOC Flag</th>
                      <th>Agent Code</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeHbl.containers.map((ct, ci) => (
                      <tr key={ci}>
                        <td style={{ textAlign: 'center', color: '#888', fontSize: 12 }}>{ci + 1}</td>
                        <td>
                          <input
                            className="form-control ef-table-input font-mono"
                            value={ct.container_no}
                            maxLength={11}
                            placeholder="AAAA1234567"
                            style={{ borderColor: ct.container_no && !isValidContainerNo(ct.container_no) ? '#dc2626' : '' }}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'container_no', formatContainerNo(e.target.value))}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control ef-table-input"
                            value={ct.seal_no}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'seal_no', e.target.value.toUpperCase())}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control ef-table-input"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ct.package_count}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'package_count', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control ef-table-input"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={ct.weight}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'weight', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control ef-table-input"
                            value={ct.container_size}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'container_size', e.target.value.toUpperCase())}
                          />
                        </td>
                        <td>
                          <select
                            className="form-control ef-table-input"
                            value={ct.container_type}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'container_type', e.target.value)}
                          >
                            {CONTAINER_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-control ef-table-input"
                            value={ct.soc_flag}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'soc_flag', e.target.value)}
                          >
                            {SOC_FLAG_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            className="form-control ef-table-input"
                            value={ct.agent_code}
                            onChange={(e) => updateContainer(activeHblTab, ci, 'agent_code', e.target.value.toUpperCase())}
                          />
                        </td>
                        <td>
                          <button
                            className="btn-link danger"
                            onClick={() => removeContainer(activeHblTab, ci)}
                            title="Remove container"
                            disabled={activeHbl.containers.length <= 1}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* â”€â”€ Form Actions â”€â”€ */}
        <div className="ef-form-actions">
          <button className="btn btn-warning" onClick={resetEditor}>Reset</button>
          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Savingâ€¦' : 'Save MBL + HBL + Container'}
          </button>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SAVED MBL REGISTER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="card sea-register-card" style={{ marginTop: 28 }}>
        <div className="card-header sea-register-header">
          <div>
            <span className="card-title">Saved MBL Register</span>
            <div className="text-sm text-muted" style={{ marginTop: 2 }}>
              Click any row to load it into the editor above.
            </div>
          </div>
          <div className="sea-search-wrap">
            <input
              className="form-control"
              placeholder="Search MBL, importer, or HBL"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { setPage(1); fetchMbls(1, pageSize); }
              }}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setPage(1); fetchMbls(1, pageSize); }}
            >
              Search
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><span className="spinner" /> Loadingâ€¦</div>
          ) : mbls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No MBL records found</div>
              <p>Create your first sea shipment from the editor above.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>MBL No.</th>
                  <th>Date</th>
                  <th>Importer</th>
                  <th>Shipping Line</th>
                  <th>Location</th>
                  <th>Packages</th>
                  <th>Gross Wt</th>
                  <th>HBLs</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mbls.map((record) => (
                  <tr
                    key={record.id}
                    className={record.id === selectedMblId ? 'sea-row-active' : ''}
                    onClick={() => loadDetail(record.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="font-mono" style={{ fontWeight: 700 }}>{record.mbl_no}</td>
                    <td>{fmtDate(record.mbl_date || record.created_at)}</td>
                    <td>{record.importer_name || 'â€”'}</td>
                    <td>{record.shipping_line || record.carrier_name || 'â€”'}</td>
                    <td className="font-mono text-sm">{record.customs_house_code || 'â€”'}</td>
                    <td>{record.total_packages}</td>
                    <td>{toNumber(record.total_gross_weight).toFixed(3)}</td>
                    <td>{record.hbl_count || 0}</td>
                    <td><span className="badge badge-info">{record.status}</span></td>
                    <td>{fmtDateTime(record.updated_at)}</td>
                    <td onClick={(e) => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: 4 }}
                        title="View Checklist"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/checklist/${record.id}`);
                        }}
                      >
                        Checklist
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: 4 }}
                        title="Generate &amp; download CGM file"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const resp = await api.post(`/sea-transmissions/generate/${record.id}`, {});
                            const blob = new Blob([resp.data.fileContent], { type: 'text/plain;charset=utf-8' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = resp.data.fileName;
                            document.body.appendChild(a); a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                            toast.success(`Downloaded: ${resp.data.fileName}`);
                            fetchHistory();
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Generation failed');
                          }
                        }}
                      >
                        CGM
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        title="Delete this MBL"
                        onClick={(e) => handleRowDelete(record, e)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPage={(p) => setPage(p)}
          onPageSize={(ps) => { setPageSize(ps); setPage(1); }}
        />
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CGM TRANSMISSION HISTORY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {history.length > 0 && (
        <div className="card sea-register-card" style={{ marginTop: 20 }}>
          <div className="card-header sea-register-header">
            <span className="card-title">Recent CGM Transmissions</span>
            <button className="btn btn-secondary btn-sm" onClick={fetchHistory}>Refresh</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>MBL No.</th>
                  <th>Generated By</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx.id}>
                    <td className="font-mono text-sm">{tx.file_name}</td>
                    <td className="font-mono">{tx.mbl_no || 'â€”'}</td>
                    <td>{tx.username || 'â€”'}</td>
                    <td><span className="badge badge-info">{tx.status}</span></td>
                    <td>{fmtDateTime(tx.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                          try {
                            const resp = await api.get(`/sea-transmissions/download/${tx.id}`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([resp.data]));
                            const a = document.createElement('a');
                            a.href = url; a.download = tx.file_name;
                            document.body.appendChild(a); a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                          } catch {
                            toast.error('Download failed');
                          }
                        }}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="sea-footer">EDI Software Solutions @ 2022 â€“ 2026 All rights reserved</div>
    </div>
  );
};

export default SeaConsolePage;
