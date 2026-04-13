import { ColorRing } from "react-loader-spinner";
import { useState } from "react";
import CollectionModal from "./CollectionModal";
import DownloadModal from "../pages/DownloadModal";

const ECFR_URL = "https://www.ecfr.gov";
const MAX_VOLUME = 10000;
const RATIO_WEIGHT = 0.7;
const VOLUME_WEIGHT = 0.3;


function scoreResult(item) {
 const num = (item.documentNumerator ?? 0) + (item.commentNumerator ?? 0);
 const total = (item.documentDenominator ?? 0) + (item.commentDenominator ?? 0);


 if (total === 0) return 0;


 const ratioScore = num / total;
 const volumeScore = Math.min(total / MAX_VOLUME, 1);
 return (ratioScore * RATIO_WEIGHT) + (volumeScore * VOLUME_WEIGHT);
}


export default function ResultsPanel({
 results,
 loading,
 hasSearched,
 query,
 unauthorized,
 appliedFilters,
 onRemoveAgency,
 onRemoveCfrPart,
 onClearDocType,
 onClearYearFrom,
 onClearYearTo,
 onClearAllFilters,
}) {

 const [modalDocketId, setModalDocketId] = useState(null);
 const [downloadDocketId, setDownloadDocketId] = useState(null);

 const filterChips = [];

 if (appliedFilters?.docType) {
   filterChips.push({
     key: `doc-type-${appliedFilters.docType}`,
     label: `Type: ${appliedFilters.docType}`,
     onRemove: onClearDocType,
   });
 }

 if (appliedFilters?.yearFrom) {
   filterChips.push({
     key: `year-from-${appliedFilters.yearFrom}`,
     label: `From: ${appliedFilters.yearFrom}`,
     onRemove: onClearYearFrom,
   });
 }

 if (appliedFilters?.yearTo) {
   filterChips.push({
     key: `year-to-${appliedFilters.yearTo}`,
     label: `To: ${appliedFilters.yearTo}`,
     onRemove: onClearYearTo,
   });
 }

 (appliedFilters?.agencies || []).forEach((agency) => {
   filterChips.push({
     key: `agency-${agency}`,
     label: `Agency: ${agency}`,
     onRemove: () => onRemoveAgency(agency),
   });
 });

 (appliedFilters?.cfrParts || []).forEach(({ title, part }) => {
   filterChips.push({
     key: `cfr-${title}-${part}`,
     label: `Title ${title} Part ${part}`,
     onRemove: () => onRemoveCfrPart(title, part),
   });
 });

 if (unauthorized) {
   return (
     <div className="results">
       <p>Please <a href="/login">log in</a> to search.</p>
     </div>
   );
 }

 if (loading) {
   return (
     <div className="results">
       <ColorRing
         visible={true}
         height="80"
         width="80"
         ariaLabel="color-ring-loading"
         colors={["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"]}
       />
     </div>
   );
 }
 if (!hasSearched) return null;
 if (!results || results.length === 0) {
   return (
     <div className="results">
       {filterChips.length > 0 && (
         <div className="active-filters-panel">
           <div className="active-filters-header">
             <p className="active-filters-title">Active filters</p>
             <button type="button" className="active-filters-clear" onClick={onClearAllFilters}>
               Clear all
             </button>
           </div>
           <div className="active-filters-row">
             {filterChips.map((chip) => (
               <button
                 key={chip.key}
                 type="button"
                 className="active-filter-chip"
                 onClick={chip.onRemove}
               >
                 <span>{chip.label}</span>
                 <span aria-hidden>×</span>
               </button>
             ))}
           </div>
         </div>
       )}
       <p>No results found.</p>
     </div>
   );
 }


 const sortedResults = [...results].sort((a, b) => scoreResult(b) - scoreResult(a));


 return (
   <div className="results">
    {filterChips.length > 0 && (
      <div className="active-filters-panel">
        <div className="active-filters-header">
          <p className="active-filters-title">Active filters</p>
          <button type="button" className="active-filters-clear" onClick={onClearAllFilters}>
            Clear all
          </button>
        </div>
        <div className="active-filters-row">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="active-filter-chip"
              onClick={chip.onRemove}
            >
              <span>{chip.label}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      </div>
    )}
    {modalDocketId && (
    <CollectionModal
      docketId={modalDocketId}
      onClose={() => setModalDocketId(null)}
    />
  )}

    {/* Download modal for a single docket */}
    {downloadDocketId && (
    <DownloadModal
        collectionName={null}
        docketIds={[downloadDocketId]}
        onClose={() => setDownloadDocketId(null)}
      />
    )}

     <p className="results-summary">
       Showing results for "<strong>{query}</strong>" • {results.length} docket{results.length !== 1 ? "s" : ""} found
     </p>
     {sortedResults.map((item, index) => (
       <div key={item.docket_id || index} className="result-card">
         <div className="result-card-body">
            <div className="result-card-info">
               <h3 className="result-title">{item.docket_title}</h3>
               <div className="result-meta">
                 <p><strong>Agency:</strong> {item.agency_id}</p>
                 <p><strong>Docket-ID:</strong> {item.docket_id}</p>
                 <p><strong>Docket type:</strong> {item.docket_type}</p>
                 <p>
                   <strong>CFR:</strong>{" "}
                   {item.cfrPart && item.cfrPart.length > 0 ? (
                     item.cfrPart.map((p, idx) => (
                       <span key={idx}>
                         <a href={p.link} target="_blank" rel="noopener noreferrer">
                           {p.title != null ? `${p.title} Part ${p.part}` : p.part}
                         </a>
                         {idx < item.cfrPart.length - 1 && ", "}
                       </span>
                     ))
                   ) : (
                     <a href={ECFR_URL} target="_blank" rel="noopener noreferrer">None</a>
                   )}
                 </p>
                 <p><strong>Last modified date:</strong> {item.modify_date}</p>
                 <p><strong>Documents:</strong> {item.documentNumerator ?? 0}/{item.documentDenominator ?? 0}</p>
                 <p><strong>Comments:</strong> {item.commentNumerator ?? 0}/{item.commentDenominator ?? 0}</p>
               </div>
               {item.summary && (
                 <p className="result-summary">{item.summary}</p>
               )}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn-add-collection" onClick={() => setModalDocketId(item.docket_id)}>
                Add to Collection
              </button>
              <button className="btn-add-collection" onClick={() => setDownloadDocketId(item.docket_id)}>
                Download
              </button>
            </div>
          </div>
        </div>
     ))}
   </div>
 );
}
