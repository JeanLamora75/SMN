/** One explicit privacy approval applies only to the exact text displayed and checked. */
export type BriefReviewState={
 preview:string|null;
 currentTxt:string;
 reviewedText:string|null;
 privacyReviewed:boolean;
 revisionChecked:boolean;
 conflict:boolean;
};
export function canApproveBrief(state:BriefReviewState):boolean{
 return state.preview!==null &&
  state.preview===state.currentTxt &&
  state.reviewedText===state.preview &&
  state.privacyReviewed &&
  state.revisionChecked &&
  !state.conflict;
}
