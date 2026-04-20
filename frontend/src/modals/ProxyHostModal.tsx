import { IconPlus, IconSettings, IconTrash } from "@tabler/icons-react";
import cn from "classnames";
import EasyModal, { type InnerModalProps } from "ez-modal-react";
import { Field, Form, Formik } from "formik";
import { type ReactNode, useState } from "react";
import { Alert } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import {
	AccessField,
	Button,
	DomainNamesField,
	HasPermission,
	Loading,
	LocationsFields,
	NginxConfigField,
	SSLCertificateField,
	SSLOptionsFields,
} from "src/components";
import { useProxyHost, useSetProxyHost, useUser } from "src/hooks";
import { T } from "src/locale";
import { MANAGE, PROXY_HOSTS } from "src/modules/Permissions";
import { validateNumber, validateString } from "src/modules/Validations";
import { showObjectSuccess } from "src/notifications";

const showProxyHostModal = (id: number | "new") => {
	EasyModal.show(ProxyHostModal, { id });
};

interface Props extends InnerModalProps {
	id: number | "new";
}
const ProxyHostModal = EasyModal.create(({ id, visible, remove }: Props) => {
	const { data: currentUser, isLoading: userIsLoading, error: userError } = useUser("me");
	const { data, isLoading, error } = useProxyHost(id);
	const { mutate: setProxyHost } = useSetProxyHost();
	const [errorMsg, setErrorMsg] = useState<ReactNode | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (values: any, { setSubmitting }: any) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setErrorMsg(null);

		const payload = {
			id: id === "new" ? undefined : id,
			...values,
		};
		// 删除前端专用的状态字段，防止被后端 AJV 校验额外属性拦截
		delete payload.enableLoadBalance;

		setProxyHost(payload, {
			onError: (err: any) => setErrorMsg(<T id={err.message} />),
			onSuccess: () => {
				showObjectSuccess("proxy-host", "saved");
				remove();
			},
			onSettled: () => {
				setIsSubmitting(false);
				setSubmitting(false);
			},
		});
	};

	return (
		<Modal show={visible} onHide={remove}>
			{!isLoading && (error || userError) && (
				<Alert variant="danger" className="m-3">
					{error?.message || userError?.message || "Unknown error"}
				</Alert>
			)}
			{isLoading || (userIsLoading && <Loading noLogo />)}
			{!isLoading && !userIsLoading && data && currentUser && (
				<Formik
					initialValues={
						{
							// Details tab
							domainNames: data?.domainNames || [],
							forwardScheme: data?.forwardScheme || "http",
							forwardHost: data?.forwardHost || "",
							forwardPort: data?.forwardPort || undefined,
							accessListId: data?.accessListId || 0,
							cachingEnabled: data?.cachingEnabled || false,
							blockExploits: data?.blockExploits || false,
							allowWebsocketUpgrade: data?.allowWebsocketUpgrade || false,
							// 负载均衡
							upstreamServers: data?.upstreamServers || [],
							loadBalanceMethod: data?.loadBalanceMethod || "round_robin",
							enableLoadBalance: (data?.upstreamServers && data.upstreamServers.length > 0) || false,
							// Locations tab
							locations: data?.locations || [],
							// SSL tab
							certificateId: data?.certificateId || 0,
							sslForced: data?.sslForced || false,
							http2Support: data?.http2Support || false,
							hstsEnabled: data?.hstsEnabled || false,
							hstsSubdomains: data?.hstsSubdomains || false,
							trustForwardedProto: data?.trustForwardedProto || false,
							// 覆写目标域名
							forwardHostOverride: data?.forwardHostOverride || "",
							// Advanced tab
							advancedConfig: data?.advancedConfig || "",
							meta: data?.meta || {},
						} as any
					}
					onSubmit={onSubmit}
				>
					{() => (
						<Form>
							<Modal.Header closeButton>
								<Modal.Title>
									<T id={data?.id ? "object.edit" : "object.add"} tData={{ object: "proxy-host" }} />
								</Modal.Title>
							</Modal.Header>
							<Modal.Body className="p-0">
								<Alert variant="danger" show={!!errorMsg} onClose={() => setErrorMsg(null)} dismissible>
									{errorMsg}
								</Alert>
								<div className="card m-0 border-0">
									<div className="card-header">
										<ul className="nav nav-tabs card-header-tabs" data-bs-toggle="tabs">
											<li className="nav-item" role="presentation">
												<a
													href="#tab-details"
													className="nav-link active"
													data-bs-toggle="tab"
													aria-selected="true"
													role="tab"
												>
													<T id="column.details" />
												</a>
											</li>
											<li className="nav-item" role="presentation">
												<a
													href="#tab-locations"
													className="nav-link"
													data-bs-toggle="tab"
													aria-selected="false"
													tabIndex={-1}
													role="tab"
												>
													<T id="column.custom-locations" />
												</a>
											</li>
											<li className="nav-item" role="presentation">
												<a
													href="#tab-ssl"
													className="nav-link"
													data-bs-toggle="tab"
													aria-selected="false"
													tabIndex={-1}
													role="tab"
												>
													<T id="column.ssl" />
												</a>
											</li>
											<li className="nav-item ms-auto" role="presentation">
												<a
													href="#tab-advanced"
													className="nav-link"
													title="Settings"
													data-bs-toggle="tab"
													aria-selected="false"
													tabIndex={-1}
													role="tab"
												>
													<IconSettings size={20} />
												</a>
											</li>
										</ul>
									</div>
									<div className="card-body">
										<div className="tab-content">
											<div className="tab-pane active show" id="tab-details" role="tabpanel">
												<DomainNamesField isWildcardPermitted dnsProviderWildcardSupported />

												{/* ===== 负载均衡开关 ===== */}
												<Field name="enableLoadBalance">
													{({ field, form }: any) => (
														<div className="mb-3">
															<label className="row" htmlFor="enableLoadBalance">
																<span className="col">
																	<strong>启用负载均衡</strong>
																</span>
																<span className="col-auto">
																	<label className="form-check form-check-single form-switch">
																		<input
																			id="enableLoadBalance"
																			className={cn("form-check-input", {
																				"bg-lime": field.value,
																			})}
																			type="checkbox"
																			checked={field.value}
																			onChange={(e: any) => {
																				form.setFieldValue("enableLoadBalance", e.target.checked);
																				if (e.target.checked && form.values.upstreamServers.length === 0) {
																					// 自动添加一行默认上游服务器
																					form.setFieldValue("upstreamServers", [{ scheme: "http", server: "", port: 80, weight: 1 }]);
																				}
																				if (!e.target.checked) {
																					form.setFieldValue("upstreamServers", []);
																				}
																			}}
																		/>
																	</label>
																</span>
															</label>
														</div>
													)}
												</Field>

												<Field name="enableLoadBalance">
													{({ field, form }: any) => (
														<>
															{/* ===== 负载均衡关闭：原有单节点输入 ===== */}
															{!field.value && (
																<div className="row">
																	<div className="col-md-3">
																		<Field name="forwardScheme">
																			{({ field: schemeField }: any) => (
																				<div className="mb-3">
																					<label className="form-label" htmlFor="forwardScheme">
																						<T id="host.forward-scheme" />
																					</label>
																					<select id="forwardScheme" className="form-control" required {...schemeField}>
																						<option value="http">http</option>
																						<option value="https">https</option>
																					</select>
																				</div>
																			)}
																		</Field>
																	</div>
																	<div className="col-md-6">
																		<Field name="forwardHost" validate={validateString(1, 255)}>
																			{({ field: hostField, form: hostForm }: any) => (
																				<div className="mb-3">
																					<label className="form-label" htmlFor="forwardHost">
																						<T id="proxy-host.forward-host" />
																					</label>
																					<input id="forwardHost" type="text" className={`form-control ${hostForm.errors.forwardHost && hostForm.touched.forwardHost ? "is-invalid" : ""}`} required placeholder="example.com" {...hostField} />
																					{hostForm.errors.forwardHost && hostForm.touched.forwardHost && <div className="invalid-feedback">{hostForm.errors.forwardHost}</div>}
																				</div>
																			)}
																		</Field>
																	</div>
																	<div className="col-md-3">
																		<Field name="forwardPort" validate={validateNumber(1, 65535)}>
																			{({ field: portField, form: portForm }: any) => (
																				<div className="mb-3">
																					<label className="form-label" htmlFor="forwardPort">
																						<T id="host.forward-port" />
																					</label>
																					<input id="forwardPort" type="number" min={1} max={65535} className={`form-control ${portForm.errors.forwardPort && portForm.touched.forwardPort ? "is-invalid" : ""}`} required placeholder="eg: 8081" {...portField} />
																					{portForm.errors.forwardPort && portForm.touched.forwardPort && <div className="invalid-feedback">{portForm.errors.forwardPort}</div>}
																				</div>
																			)}
																		</Field>
																	</div>
																</div>
															)}

															{/* ===== 覆写目标域名（Lua Host 伪装 + SNI 穿透） ===== */}
															{!field.value && (
																<div className="row">
																	<div className="col-md-12">
																		<Field name="forwardHostOverride">
																			{({ field: overrideField }: any) => (
																				<div className="mb-3">
																					<label className="form-label" htmlFor="forwardHostOverride">
																						覆写目标域名 (Override Host)
																					</label>
																					<input
																						id="forwardHostOverride"
																						type="text"
																						className="form-control"
																						placeholder="留空不覆写，填写后自动启用 Lua Host 伪装 + SNI 穿透"
																						{...overrideField}
																					/>
																					<small className="form-hint">
																						反代受 Cloudflare / Zeabur 等网关防护的外部站点时，填入真实目标域名即可自动绕过 Host 标头冲突
																					</small>
																				</div>
																			)}
																		</Field>
																	</div>
																</div>
															)}

															{/* ===== 负载均衡开启：上游服务器列表 ===== */}
															{field.value && (
																<div className="mb-3">
																	{/* 负载均衡算法 */}
																	<div className="row mb-3">
																		<div className="col-md-6">
																			<Field name="loadBalanceMethod">
																				{({ field: methodField }: any) => (
																					<div>
																						<label className="form-label" htmlFor="loadBalanceMethod">负载均衡算法</label>
																						<select id="loadBalanceMethod" className="form-control" {...methodField}>
																							<option value="round_robin">Round Robin（轮询）</option>
																							<option value="least_conn">Least Connections（最少连接）</option>
																							<option value="ip_hash">IP Hash（IP 哈希）</option>
																						</select>
																					</div>
																				)}
																			</Field>
																		</div>
																	</div>

																	{/* 上游服务器表格 */}
																	<label className="form-label">上游服务器</label>
																	<div className="table-responsive">
																		<table className="table table-vcenter table-sm">
																			<thead>
																				<tr>
																					<th style={{width: "100px"}}>协议</th>
																					<th>服务器地址</th>
																					<th style={{width: "100px"}}>端口</th>
																					<th style={{width: "80px"}}>权重</th>
																					<th style={{width: "50px"}}></th>
																				</tr>
																			</thead>
																			<tbody>
																				{form.values.upstreamServers.map((_us: any, idx: number) => (
																					<tr key={idx}>
																						<td>
																							<Field name={`upstreamServers.${idx}.scheme`}>
																								{({ field: f }: any) => (
																									<select className="form-control form-control-sm" {...f}>
																										<option value="http">http</option>
																										<option value="https">https</option>
																									</select>
																								)}
																							</Field>
																						</td>
																						<td>
																							<Field name={`upstreamServers.${idx}.server`}>
																								{({ field: f }: any) => (
																									<input type="text" className="form-control form-control-sm" placeholder="192.168.1.10 或 example.com" {...f} />
																								)}
																							</Field>
																						</td>
																						<td>
																							<Field name={`upstreamServers.${idx}.port`}>
																								{({ field: f }: any) => (
																									<input type="number" min={1} max={65535} className="form-control form-control-sm" placeholder="80" {...f} />
																								)}
																							</Field>
																						</td>
																						<td>
																							<Field name={`upstreamServers.${idx}.weight`}>
																								{({ field: f }: any) => (
																									<input type="number" min={1} max={100} className="form-control form-control-sm" placeholder="1" {...f} />
																								)}
																							</Field>
																						</td>
																						<td>
																							<button
																								type="button"
																								className="btn btn-ghost-danger btn-icon btn-sm"
																								onClick={() => {
																									const newServers = [...form.values.upstreamServers];
																									newServers.splice(idx, 1);
																									form.setFieldValue("upstreamServers", newServers);
																								}}
																								disabled={form.values.upstreamServers.length <= 1}
																							>
																								<IconTrash size={16} />
																							</button>
																						</td>
																					</tr>
																				))}
																			</tbody>
																		</table>
																	</div>
																	<button
																		type="button"
																		className="btn btn-outline-primary btn-sm"
																		onClick={() => {
																			form.setFieldValue("upstreamServers", [
																				...form.values.upstreamServers,
																				{ scheme: "http", server: "", port: 80, weight: 1 },
																			]);
																		}}
																	>
																		<IconPlus size={16} className="me-1" /> 添加服务器
																	</button>
																</div>
															)}
														</>
													)}
												</Field>

												<AccessField />
												<div className="my-3">
													<h4 className="py-2">
														<T id="options" />
													</h4>
													<div className="divide-y">
														<div>
															<label className="row" htmlFor="cachingEnabled">
																<span className="col">
																	<T id="host.flags.cache-assets" />
																</span>
																<span className="col-auto">
																	<Field name="cachingEnabled" type="checkbox">
																		{({ field }: any) => (
																			<label className="form-check form-check-single form-switch">
																				<input
																					{...field}
																					id="cachingEnabled"
																					className={cn("form-check-input", {
																						"bg-lime": field.checked,
																					})}
																					type="checkbox"
																				/>
																			</label>
																		)}
																	</Field>
																</span>
															</label>
														</div>
														<div>
															<label className="row" htmlFor="blockExploits">
																<span className="col">
																	<T id="host.flags.block-exploits" />
																</span>
																<span className="col-auto">
																	<Field name="blockExploits" type="checkbox">
																		{({ field }: any) => (
																			<label className="form-check form-check-single form-switch">
																				<input
																					{...field}
																					id="blockExploits"
																					className={cn("form-check-input", {
																						"bg-lime": field.checked,
																					})}
																					type="checkbox"
																				/>
																			</label>
																		)}
																	</Field>
																</span>
															</label>
														</div>
														<div>
															<label className="row" htmlFor="allowWebsocketUpgrade">
																<span className="col">
																	<T id="host.flags.websockets-upgrade" />
																</span>
																<span className="col-auto">
																	<Field name="allowWebsocketUpgrade" type="checkbox">
																		{({ field }: any) => (
																			<label className="form-check form-check-single form-switch">
																				<input
																					{...field}
																					id="allowWebsocketUpgrade"
																					className={cn("form-check-input", {
																						"bg-lime": field.checked,
																					})}
																					type="checkbox"
																				/>
																			</label>
																		)}
																	</Field>
																</span>
															</label>
														</div>
													</div>
												</div>
											</div>
											<div className="tab-pane" id="tab-locations" role="tabpanel">
												<LocationsFields initialValues={data?.locations || []} />
											</div>
											<div className="tab-pane" id="tab-ssl" role="tabpanel">
												<SSLCertificateField
													name="certificateId"
													label="ssl-certificate"
													allowNew
												/>
												<SSLOptionsFields color="bg-lime" forProxyHost={true} />
											</div>
											<div className="tab-pane" id="tab-advanced" role="tabpanel">
												<NginxConfigField />
											</div>
										</div>
									</div>
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button data-bs-dismiss="modal" onClick={remove} disabled={isSubmitting}>
									<T id="cancel" />
								</Button>
								<HasPermission section={PROXY_HOSTS} permission={MANAGE} hideError>
									<Button
										type="submit"
										actionType="primary"
										className="ms-auto bg-lime"
										data-bs-dismiss="modal"
										isLoading={isSubmitting}
										disabled={isSubmitting}
									>
										<T id="save" />
									</Button>
								</HasPermission>
							</Modal.Footer>
						</Form>
					)}
				</Formik>
			)}
		</Modal>
	);
});

export { showProxyHostModal };
