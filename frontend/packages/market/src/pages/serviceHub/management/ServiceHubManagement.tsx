import { MenuProps, Menu, App, Avatar, Card, Tooltip, Empty } from "antd";
import { useState, forwardRef, useEffect, useRef } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import { BasicResponse, RESPONSE_TIPS, STATUS_CODE } from "@common/const/const";
import { ServiceHubAppListItem } from "../../../const/serviceHub/type";
import { useFetch } from "@common/hooks/http";
import { useBreadcrumb } from "@common/contexts/BreadcrumbContext";
import ManagementConfig, { ManagementConfigHandle } from "./ManagementConfig";
import { useNavigate, useParams } from "react-router-dom";
import { RouterParams } from "@core/components/aoplatform/RenderRoutes";
import { SimpleTeamItem } from "@common/const/type";
import { useTenantManagementContext } from "../../../contexts/TenantManagementContext";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useGlobalContext } from "@common/contexts/GlobalStateContext";
import { $t } from "@common/locales";
import WithPermission from "@common/components/aoplatform/WithPermission";

export default function ServiceHubManagement() {
    const { message ,modal} = App.useApp()
    const { teamId} = useParams<RouterParams>()
    const [serviceList, setServiceList] = useState<ServiceHubAppListItem[]>([])
    const {fetchData} = useFetch()
    const { setBreadcrumb} = useBreadcrumb()
    const addManagementRef = useRef<ManagementConfigHandle>(null)
    const [pageLoading, setPageLoading] = useState<boolean>(false)
    const [serviceLoading, setServiceLoading] = useState<boolean>(false)
    const [teamList, setTeamList] = useState<MenuItem[]>([])
    const {setAppName} = useTenantManagementContext()
    const navigateTo = useNavigate()
    const {getTeamAccessData,cleanTeamAccessData,checkPermission,getGlobalAccessData,accessInit} = useGlobalContext()
    type MenuItem = Required<MenuProps>['items'][number];


const getServiceList = ()=>{
    if(!accessInit){
        getGlobalAccessData()?.then?.(()=>{getServiceList()})
        return
    }
    setServiceLoading(true)
        return fetchData<BasicResponse<{apps:ServiceHubAppListItem}>>(!checkPermission('system.workspace.application.view_all') ? 'my_apps':'apps',{method:'GET',eoParams:{ team:teamId,keyword:''},eoTransformKeys:['api_num','subscribe_num','subscribe_verify_num']}).then(response=>{
        const {code,data,msg} = response
        if(code === STATUS_CODE.SUCCESS){
            setServiceList([...data.apps,{type:'addNewItem'}])
        }else{
            message.error(msg || $t(RESPONSE_TIPS.error))
        }
    }).finally(()=>{
        setServiceLoading(false)
    })
}

  const onClick: MenuProps['onClick'] = (e) => {
    navigateTo(`/tenantManagement/list/${e.key}`)
  };

  
  const getTeamsList = ()=>{
    if(!accessInit){
        getGlobalAccessData()?.then?.(()=>{getTeamsList()})
        return
    }
    setPageLoading(true)
    fetchData<BasicResponse<{ teams: SimpleTeamItem[] }>>(!checkPermission('system.workspace.team.view_all') ?'simple/teams/mine' :'simple/teams',{method:'GET',eoTransformKeys:['app_num','subscribe_num']}).then(response=>{
        const {code,data,msg} = response
        if(code === STATUS_CODE.SUCCESS){
            setTeamList(data.teams.map((x:SimpleTeamItem)=>({label:<div className="flex items-center justify-between "><span  className="w-[calc(100%-42px)] truncate" title={x.name}>{x.name}</span><span className="bg-[#fff] rounded-[5px] h-[20px] w-[30px] flex items-center justify-center">{x.appNum || 0}</span></div>, key:x.id})))
            if(!teamId && data.teams?.[0]?.id){
                navigateTo(data.teams[0].id)
            }
        }else{
            message.error(msg || $t(RESPONSE_TIPS.error))
        }
    }).finally(()=>{
        setPageLoading(false)
    })
}
  
  
  const openModal = async (type:'add'|'edit'|'delete')=>{

    let title:string = ''
    let content:string|React.ReactNode = ''
    switch (type){
        case 'add':
            title=$t('添加应用')
            content=<ManagementConfig ref={addManagementRef} type={type} teamId={teamId!} />
            break;
        // case 'edit':{
        //     title='配置 Open Api'
        //     message.loading('正在加载数据')
        //     const {code,data,msg} = await fetchData<BasicResponse<{app:ManagementConfigFieldType}>>('external-app',{method:'GET',eoParams:{id:entity!.id}})
        //     message.destroy()
        //     if(code === STATUS_CODE.SUCCESS){
        //         content=<ManagementConfig ref={editManagementRef} type={type} entity={data.app}/>
        //     }else{
        //         message.error(msg || $t(RESPONSE_TIPS.error))
        //         return
        //     }
        //     break;}
        // case 'delete':
        //     title='删除'
        //     content='该数据删除后将无法找回，请确认是否删除？'
        //     break;
    }

    modal.confirm({
        title,
        content,
        onOk:()=> {
            switch (type){
                case 'add':
                    return addManagementRef.current?.save().then((res)=>{if(res === true) getTeamsList();getServiceList()})
                // case 'edit':
                //     return editManagementRef.current?.save().then((res)=>{if(res === true) manualReloadTable()})
                // case 'delete':
                //     return deleteManagement(entity!).then((res)=>{if(res === true) manualReloadTable()})
            }
        },
        width:600,
        okText:$t('确认'),
        cancelText:$t('取消'),
        closable:true,
        icon:<></>,
    })
}

useEffect(()=>{
    if(teamId ){
        getTeamAccessData(teamId)
        getServiceList()
    }
    return ()=>{
        cleanTeamAccessData()
    }
},[teamId])

useEffect(() => {
    setBreadcrumb(
        [
            {title:$t('应用')}
        ]
    )
    getTeamsList()
    setAppName('')
}, []);

    return (<>{
        teamList && teamList.length > 0 ?
        <div className="flex flex-1 h-full">
            <div className="w-[220px] border-0 border-solid border-r-[1px] border-r-BORDER h-full overflow-hidden">
                <div className="text-[18px] leading-[25px] pl-[20px] pt-[20px] pb-[10px] font-bold">{$t('团队')}</div>
                <Menu
                    onClick={onClick}
                    style={{ width: 220}}
                    className="overflow-auto h-[calc(100%-55px)]"
                    mode="inline"
                    items={teamList}
                    selectedKeys={teamId?[teamId]:[]}
                    />
            </div>
        <div className="w-[calc(100%-220px)] padding-top-20">
            <div className="mt-[20px]  ml-[40px] text-[18px] leading-[25px] font-bold">{$t('应用')}</div>
            <VirtuosoGrid
                style={{ height: 'calc(100% - 45px)'}}
                data={serviceList}
                totalCount={serviceList.length}
                itemContent={(index) => {
                    const item = serviceList[index];
                return (
                <div className="pt-[20px]">{
                item.type === 'addNewItem' ?<WithPermission access="team.application.application.add" showDisabled={false}><Card className="shadow-[0_5px_10px_0_rgba(0,0,0,0.05)] rounded-[10px] overflow-visible cursor-pointer h-[180px]  transition duration-500 hover:shadow-[0_5px_20px_0_rgba(0,0,0,0.15)] hover:scale-[1.05]" classNames={{body:'h-[180px] flex items-center justify-center cursor-pointer'}} onClick={()=>{openModal('add')}}>
                        <div className="flex items-center"><Icon icon="ic:baseline-add" width="18" height="18"/><span>{$t('添加应用')}</span></div>
                  </Card></WithPermission> : <Card title={CardTitle(item)} className="shadow-[0_5px_10px_0_rgba(0,0,0,0.05)] rounded-[10px] overflow-visible cursor-pointer h-[180px]  transition duration-500 hover:shadow-[0_5px_20px_0_rgba(0,0,0,0.15)] hover:scale-[1.05]" classNames={{header:'border-b-[0px] p-[20px] ', body:"pt-0"}} onClick={()=>{setAppName(item.name);navigateTo(`/tenantManagement/${teamId}/inside/${item.id}/service`)}}>
                   <span className="line-clamp-3 break-all">{item.description || $t('暂无服务描述')}</span> 

                    </Card>}</div>
                );
                }}
                components={{
                    List: forwardRef(({ style, children, ...props }, ref) => (
                    <div
                        ref={ref}
                        {...props}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        columnGap: '20px',
                        padding:'40px',
                        ...style,
                        paddingBottom:'40px'
                    }}
                    >
                        {children}
                    </div>
                    )),
                    Item: ({ children, ...props }) => (
                    <>
                        {children}</>
                    )
                }}
            />
        </div>
    </div> :
        <Empty className="mt-[100px]" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    }
    </>)
}

const CardTitle = (service:ServiceHubAppListItem)=>{
    return(
        <div className="flex">
            <Avatar shape="square" size={50}  className=" bg-theme rounded-[12px]" icon={<iconpark-icon  className="" name="auto-generate-api"></iconpark-icon>} />
            <div className="pl-[20px] w-[calc(100%-50px)]">
                <p className="text-[14px] h-[20px] leading-[20px] truncate">{service.name}</p>
                <div className="mt-[10px] h-[20px] flex items-center font-normal">
                    <Tooltip title={$t('订阅的服务数量：已通过 (0) 个，申请中 (1) 个',[service.subscribeNum ?? '-', service.subscribeVerifyNum ?? '-'])}>
                        <span className="mr-[12px] flex items-center"><span className="h-[14px] mr-[4px] flex items-center"><iconpark-icon  size="14px" name="auto-generate-api"></iconpark-icon></span><span className="font-normal text-[14px]">{(service.subscribeNum + service.subscribeVerifyNum)?? '-'}</span></span>
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}