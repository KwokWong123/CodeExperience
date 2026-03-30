function Frame() {
  return (
    <div className="bg-[#e8f1fd] flex-[1_0_0] min-h-px min-w-px relative rounded-tl-[6px] rounded-tr-[6px]">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col items-start justify-center p-[8px] relative w-full">
          <p className="font-['Helvetica_Neue:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#252a32] text-[14px] w-full">Can you remove all the irrelevant components in the table and include the three new novel molecules?</p>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex items-start justify-end overflow-clip relative rounded-tl-[6px] rounded-tr-[6px] shrink-0 w-full">
      <Frame />
    </div>
  );
}

export default function Frame2() {
  return (
    <div className="content-stretch flex flex-col items-end overflow-clip relative rounded-[6px] size-full">
      <Frame1 />
    </div>
  );
}