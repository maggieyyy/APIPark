import PageList from "@common/components/aoplatform/PageList.tsx"
import Tour from "@common/components/aoplatform/Tour.tsx"
import {ActionType} from "@ant-design/pro-components";
import  {FC, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import { App} from "antd";
import {useBreadcrumb} from "@common/contexts/BreadcrumbContext.tsx";
import {BasicResponse, RESPONSE_TIPS, STATUS_CODE} from "@common/const/const.tsx";
import {useFetch} from "@common/hooks/http.ts";
import { SimpleTeamItem ,SimpleMemberItem} from "@common/const/type.ts";
import { SystemConfigHandle, SystemTableListItem } from "../../const/system/type.ts";
import { SYSTEM_TABLE_COLUMNS } from "../../const/system/const.tsx";
import { DrawerWithFooter } from "@common/components/aoplatform/DrawerWithFooter.tsx";
import SystemConfig from "./SystemConfig.tsx";
import { useGlobalContext } from "@common/contexts/GlobalStateContext.tsx";
import { $t } from "@common/locales/index.ts";
import Joyride from "react-joyride";

const SystemList:FC = ()=>{
    const navigate = useNavigate();
    const [tableSearchWord, setTableSearchWord] = useState<string>('')
    const { setBreadcrumb } = useBreadcrumb()
    const [teamList, setTeamList] = useState<{ [k: string]: { text: string; }; }>()
    const {fetchData} = useFetch()
    const [tableListDataSource, setTableListDataSource] = useState<SystemTableListItem[]>([]);
    const [tableHttpReload, setTableHttpReload] = useState(true);
    const { message } = App.useApp()
    const pageListRef = useRef<ActionType>(null);
    const [memberValueEnum, setMemberValueEnum] = useState<{[k:string]:{text:string}}>({})
    const [open, setOpen] = useState(false);
    const drawerFormRef = useRef<SystemConfigHandle>(null)
    const {checkPermission,accessInit, getGlobalAccessData} = useGlobalContext()

    const getSystemList = ()=>{
        if(!accessInit){
            getGlobalAccessData()?.then(()=>{
                getSystemList()
            })
            return
        }
        if(!tableHttpReload){
            setTableHttpReload(true)
            return Promise.resolve({
                data: tableListDataSource,
                success: true,
            });
        }
        return fetchData<BasicResponse<{services:SystemTableListItem[]}>>(!checkPermission('system.workspace.service.view_all') ? 'my_services':'services',{method:'GET',eoParams:{keyword:tableSearchWord},eoTransformKeys:['api_num','service_num','create_time']}).then(response=>{
            const {code,data,msg} = response
            if(code === STATUS_CODE.SUCCESS){
                setTableListDataSource(data.services)
                setTableHttpReload(false)
                return  {data:data.services, success: true}
            }else{
                message.error(msg || RESPONSE_TIPS.error)
                return {data:[], success:false}
            }
        }).catch(() => {
            return {data:[], success:false}
        })
    }

    const getTeamsList = ()=>{
        if(!accessInit){
            getGlobalAccessData()?.then(()=>{
                getTeamsList()
            })
            return
        }
        fetchData<BasicResponse<{ teams: SimpleTeamItem[] }>>(!checkPermission('system.workspace.team.view_all') ?'simple/teams/mine' :'simple/teams',{method:'GET',eoTransformKeys:[]}).then(response=>{
            const {code,data,msg} = response
            setTeamList(data.teams)
            if(code === STATUS_CODE.SUCCESS){
                    const tmpValueEnum:{[k:string]:{text:string}} = {}
                    data.teams?.forEach((x:SimpleMemberItem)=>{
                        tmpValueEnum[x.name] = {text:x.name}
                    })
                    setTeamList(tmpValueEnum)
            }else{
                message.error(msg || RESPONSE_TIPS.error)
                return {data:[], success:false}
            }
        })
    }

    const manualReloadTable = () => {
        setTableHttpReload(true); // 表格数据需要从后端接口获取
        pageListRef.current?.reload()
    };

    const getMemberList = async ()=>{
        setMemberValueEnum({})
        const {code,data,msg}  = await fetchData<BasicResponse<{ members: SimpleMemberItem[] }>>('simple/member',{method:'GET'})
        if(code === STATUS_CODE.SUCCESS){
            const tmpValueEnum:{[k:string]:{text:string}} = {}
            data.members?.forEach((x:SimpleMemberItem)=>{
                tmpValueEnum[x.name] = {text:x.name}
            })
            setMemberValueEnum(tmpValueEnum)
        }else{
            message.error(msg || RESPONSE_TIPS.error)
        }
    }

    useEffect(() => {
            getTeamsList();
            getMemberList()
            setBreadcrumb([
                {
                    title: $t('服务')
                }])
    }, []);

    const onClose = () => {
        setOpen(false);
      };
    
    const columns = useMemo(()=>{
        const res =  SYSTEM_TABLE_COLUMNS.map(x=>{
            if(x.filters &&((x.dataIndex as string[])?.indexOf('master') !== -1 ) ){
                x.valueEnum = memberValueEnum
            } 
            if(x.filters &&((x.dataIndex as string[])?.indexOf('team') !== -1 ) ){
                x.valueEnum = teamList
            } 
            
            return x})
            return res
    },[memberValueEnum,teamList])

    const steps = [
        {
          target: '.my-first-step',
          content: '点击按钮新建服务',
        },
        {
          target: '.ant-table-tbody',
          content: '点击表格查看详情',
          placement: 'top'
        },
      ];
      
    return (
          <div className="h-full w-full pr-PAGE_INSIDE_X pb-PAGE_INSIDE_B">
                <Joyride steps={steps} run={true} />
            <PageList
                id="global_system"
                ref={pageListRef}
                columns={[...columns]}
                request={()=>getSystemList()}
                addNewBtnTitle={$t("添加服务")}
                addNewBtnWrapperClass={'my-first-step'}
                searchPlaceholder={$t("输入名称、ID、所属团队、负责人查找服务")}
                onAddNewBtnClick={() => {
                    setOpen(true) 
                }}
                manualReloadTable={manualReloadTable}
                onChange={() => {
                    setTableHttpReload(false)
                }}
                onSearchWordChange={(e) => {
                    setTableSearchWord(e.target.value)
                }}
                onRowClick={(row:SystemTableListItem)=>navigate(`/service/${row.team.id}/inside/${row.id}`)}
                />
                    <DrawerWithFooter title={$t("添加服务")} open={open} onClose={onClose} onSubmit={()=>drawerFormRef.current?.save()?.then((res)=>{res && manualReloadTable();return res})} >
                        <SystemConfig ref={drawerFormRef} />
                    </DrawerWithFooter>
                </div>
    )

}
export default SystemList