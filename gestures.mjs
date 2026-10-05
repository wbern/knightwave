export async function swipe(page,direction='up',x=null){
  const size=page.viewportSize(),px=x??size.width*.5,startY=size.height*.72,endY=startY+(direction==='up'?-95:95);
  const session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:px,y:startY,id:1}]});
  for(let i=1;i<=5;i++){
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:px+6*i/5,y:startY+(endY-startY)*i/5,id:1}]});
    await page.waitForTimeout(16);
  }
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
}
